import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { AdminHeader } from "@/components/layouts/admin-header"
import { AdminSidebar } from "@/components/layouts/admin-sidebar"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // 管理者権限チェック
  if (!session || session.user.role !== "admin") {
    redirect("/login?error=管理者権限が必要です")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader user={session.user} />
      <div className="flex">
        <AdminSidebar user={session.user} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}