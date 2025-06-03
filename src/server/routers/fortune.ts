import { z } from "zod"
import { createTRPCRouter, publicProcedure, protectedProcedure } from "@/server/api/trpc"

export const fortuneRouter = createTRPCRouter({
  // 占い種別一覧取得（認証不要）
  getTypes: publicProcedure.query(async ({ ctx }) => {
    const fortuneTypes = await ctx.db.fortuneType.findMany({
      where: {
        is_active: true
      },
      orderBy: {
        created_at: 'asc'
      }
    })
    
    return fortuneTypes
  }),

  // ユーザーの占い履歴取得
  getHistory: protectedProcedure
    .input(z.object({
      status: z.enum(['pending', 'processing', 'ai_generated', 'editing', 'approved', 'published']).optional(),
      limit: z.number().min(1).max(100).default(10),
      page: z.number().min(1).default(1)
    }))
    .query(async ({ ctx, input }) => {
      const { status, limit, page } = input
      const skip = (page - 1) * limit

      const where = {
        user_id: ctx.user.id,
        ...(status && { status })
      }

      const [requests, total] = await Promise.all([
        ctx.db.fortuneRequest.findMany({
          where,
          include: {
            fortune_type: true,
            fortune_result: true
          },
          orderBy: {
            created_at: 'desc'
          },
          skip,
          take: limit
        }),
        ctx.db.fortuneRequest.count({ where })
      ])

      return {
        requests,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    }),

  // 特定の占い申込の詳細取得
  getRequest: protectedProcedure
    .input(z.object({
      id: z.string().uuid()
    }))
    .query(async ({ ctx, input }) => {
      const request = await ctx.db.fortuneRequest.findFirst({
        where: {
          id: input.id,
          user_id: ctx.user.id
        },
        include: {
          fortune_type: true,
          ai_result: true,
          fortune_result: true
        }
      })

      if (!request) {
        throw new Error('鑑定申込が見つかりません')
      }

      return request
    }),

  // 占い申込の作成
  create: protectedProcedure
    .input(z.object({
      fortuneTypeId: z.string().uuid(),
      inputData: z.record(z.any())
    }))
    .mutation(async ({ ctx, input }) => {
      const { fortuneTypeId, inputData } = input

      // 占い種別の取得
      const fortuneType = await ctx.db.fortuneType.findUnique({
        where: { id: fortuneTypeId }
      })

      if (!fortuneType || !fortuneType.is_active) {
        throw new Error('選択された占い種別は利用できません')
      }

      // ユーザーのクレジット残高確認
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.user.id }
      })

      if (!user || user.credits < fortuneType.required_credits) {
        throw new Error('クレジットが不足しています')
      }

      // トランザクション処理
      const result = await ctx.db.$transaction(async (tx) => {
        // クレジット消費
        await tx.user.update({
          where: { id: ctx.user.id },
          data: {
            credits: {
              decrement: fortuneType.required_credits
            }
          }
        })

        // クレジット取引履歴の記録
        await tx.creditTransaction.create({
          data: {
            user_id: ctx.user.id,
            amount: -fortuneType.required_credits,
            type: 'usage',
            description: `${fortuneType.name}の利用`
          }
        })

        // 占い申込の作成
        const fortuneRequest = await tx.fortuneRequest.create({
          data: {
            user_id: ctx.user.id,
            fortune_type_id: fortuneTypeId,
            input_data: inputData,
            status: 'pending'
          },
          include: {
            fortune_type: true
          }
        })

        return fortuneRequest
      })

      // TODO: ここでキューにジョブを追加（後で実装）
      
      return result
    })
})