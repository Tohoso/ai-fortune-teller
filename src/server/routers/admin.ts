import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc"
import { TRPCError } from "@trpc/server"

// 管理者専用のプロシージャ
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "管理者権限が必要です"
    })
  }
  return next()
})

// 特定権限が必要なプロシージャ
const withPermission = (permission: string) => {
  return adminProcedure.use(async ({ ctx, next }) => {
    const userPermissions = ctx.user.permissions || []
    
    if (!userPermissions.includes(permission) && !userPermissions.includes("*")) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "この操作の権限がありません"
      })
    }
    
    return next()
  })
}

export const adminRouter = createTRPCRouter({
  // 管理者ダッシュボード統計情報
  getDashboardStats: adminProcedure.query(async ({ ctx }) => {
    const [
      totalUsers,
      totalRequests,
      pendingReviews,
      todayRequests,
      totalRevenue
    ] = await Promise.all([
      ctx.db.user.count(),
      ctx.db.fortuneRequest.count(),
      ctx.db.aiResult.count({
        where: { status: "pending_review" }
      }),
      ctx.db.fortuneRequest.count({
        where: {
          created_at: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      ctx.db.creditTransaction.aggregate({
        where: { type: "purchase" },
        _sum: { amount: true }
      })
    ])

    return {
      totalUsers,
      totalRequests,
      pendingReviews,
      todayRequests,
      totalRevenue: totalRevenue._sum.amount || 0
    }
  }),

  // 鑑定結果一覧（レビュー用）
  getFortuneResults: withPermission("fortune:review").input(
    z.object({
      status: z.enum(["pending_review", "editing", "approved", "published"]).optional(),
      limit: z.number().min(1).max(100).default(20),
      page: z.number().min(1).default(1),
    })
  ).query(async ({ ctx, input }) => {
    const { status, limit, page } = input
    const skip = (page - 1) * limit

    const where = status ? { status } : {}

    const [results, total] = await Promise.all([
      ctx.db.aiResult.findMany({
        where,
        include: {
          fortune_request: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              },
              fortune_type: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        },
        skip,
        take: limit
      }),
      ctx.db.aiResult.count({ where })
    ])

    return {
      results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }),

  // 特定鑑定結果の詳細取得
  getFortuneResult: withPermission("fortune:review").input(
    z.object({
      id: z.string().uuid()
    })
  ).query(async ({ ctx, input }) => {
    const result = await ctx.db.aiResult.findUnique({
      where: { id: input.id },
      include: {
        fortune_request: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            fortune_type: true
          }
        },
        fortune_result: true
      }
    })

    if (!result) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "鑑定結果が見つかりません"
      })
    }

    return result
  }),

  // 鑑定結果の編集
  updateFortuneResult: withPermission("fortune:review").input(
    z.object({
      id: z.string().uuid(),
      editedResult: z.string(),
      editorNotes: z.string().optional(),
    })
  ).mutation(async ({ ctx, input }) => {
    const { id, editedResult, editorNotes } = input

    const updated = await ctx.db.aiResult.update({
      where: { id },
      data: {
        edited_result: editedResult,
        editor_notes: editorNotes,
        edited_by: ctx.user.id,
        edited_at: new Date(),
        status: "editing",
        updated_at: new Date(),
      },
    })

    return updated
  }),

  // 鑑定結果の承認・公開
  approveFortuneResult: withPermission("fortune:approve").input(
    z.object({
      id: z.string().uuid(),
      finalResult: z.string(),
      approverNotes: z.string().optional(),
    })
  ).mutation(async ({ ctx, input }) => {
    const { id, finalResult, approverNotes } = input

    const result = await ctx.db.$transaction(async (tx) => {
      // AI結果の状態更新
      const updatedAiResult = await tx.aiResult.update({
        where: { id },
        data: {
          status: "approved",
          approved_by: ctx.user.id,
          approved_at: new Date(),
          updated_at: new Date(),
        },
      })

      // 最終結果を fortune_result テーブルに保存
      const fortuneResult = await tx.fortuneResult.create({
        data: {
          fortune_request_id: updatedAiResult.fortune_request_id,
          final_result: finalResult,
          approver_notes: approverNotes,
          approved_by: ctx.user.id,
          approved_at: new Date(),
        },
      })

      // 申込ステータスを更新
      await tx.fortuneRequest.update({
        where: { id: updatedAiResult.fortune_request_id },
        data: {
          status: "published",
          updated_at: new Date(),
        },
      })

      return { aiResult: updatedAiResult, fortuneResult }
    })

    // TODO: ユーザーへの完成通知メール送信
    // await sendCompletionNotification(result.aiResult.fortune_request_id)

    return result
  }),

  // 鑑定結果の却下
  rejectFortuneResult: withPermission("fortune:approve").input(
    z.object({
      id: z.string().uuid(),
      reason: z.string(),
    })
  ).mutation(async ({ ctx, input }) => {
    const { id, reason } = input

    const updated = await ctx.db.aiResult.update({
      where: { id },
      data: {
        status: "pending_review",
        editor_notes: reason,
        edited_by: ctx.user.id,
        edited_at: new Date(),
        updated_at: new Date(),
      },
    })

    return updated
  }),

  // ユーザー一覧
  getUsers: withPermission("user:manage").input(
    z.object({
      search: z.string().optional(),
      limit: z.number().min(1).max(100).default(20),
      page: z.number().min(1).default(1),
    })
  ).query(async ({ ctx, input }) => {
    const { search, limit, page } = input
    const skip = (page - 1) * limit

    const where = search ? {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ]
    } : {}

    const [users, total] = await Promise.all([
      ctx.db.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          credits: true,
          created_at: true,
          updated_at: true,
          _count: {
            select: {
              fortune_requests: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        },
        skip,
        take: limit
      }),
      ctx.db.user.count({ where })
    ])

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }),

  // ユーザーのクレジット調整
  adjustUserCredits: withPermission("user:manage").input(
    z.object({
      userId: z.string().uuid(),
      amount: z.number(),
      reason: z.string(),
    })
  ).mutation(async ({ ctx, input }) => {
    const { userId, amount, reason } = input

    const result = await ctx.db.$transaction(async (tx) => {
      // ユーザーのクレジット更新
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          credits: {
            increment: amount
          }
        }
      })

      // 取引履歴の記録
      await tx.creditTransaction.create({
        data: {
          user_id: userId,
          amount,
          type: amount > 0 ? "admin_grant" : "admin_deduct",
          description: reason,
          admin_id: ctx.user.id,
        }
      })

      return updatedUser
    })

    return result
  }),
})