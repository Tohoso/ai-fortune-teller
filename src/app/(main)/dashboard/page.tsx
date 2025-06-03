import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">ダッシュボード</h1>
      <p className="text-lg">ようこそ、{session.user.name}さん！</p>
    </div>
  )
}