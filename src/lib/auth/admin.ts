import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

// 管理者権限チェック
export async function requireAdmin() {
  const session = await auth()
  
  if (!session || session.user.role !== "admin") {
    redirect("/login?error=管理者権限が必要です")
  }
  
  return session
}

// 特定の権限チェック
export async function requirePermission(permission: string) {
  const session = await requireAdmin()
  
  if (!session.user.permissions?.includes(permission) && !session.user.permissions?.includes("*")) {
    redirect("/admin?error=この操作の権限がありません")
  }
  
  return session
}

// 管理者かどうかチェック（リダイレクトなし）
export async function isAdmin() {
  const session = await auth()
  return session?.user.role === "admin"
}

// 権限チェック（リダイレクトなし）
export async function hasPermission(permission: string) {
  const session = await auth()
  
  if (session?.user.role !== "admin") {
    return false
  }
  
  return session.user.permissions?.includes(permission) || session.user.permissions?.includes("*") || false
}

// 管理者権限の種類
export const ADMIN_PERMISSIONS = {
  FORTUNE_REVIEW: "fortune:review",    // 鑑定結果の確認・編集
  FORTUNE_APPROVE: "fortune:approve",  // 鑑定結果の承認・公開
  USER_MANAGE: "user:manage",          // ユーザー管理
  ADMIN_MANAGE: "admin:manage",        // 管理者管理
  SYSTEM_CONFIG: "system:config",      // システム設定
  ALL: "*",                            // 全権限
} as const