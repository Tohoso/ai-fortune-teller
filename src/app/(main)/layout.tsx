import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { Header } from "@/components/layouts/header"
import { Footer } from "@/components/layouts/footer"

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}