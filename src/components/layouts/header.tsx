"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { CreditCard, LogOut, User } from "lucide-react"

export function Header() {
  const router = useRouter()
  const { data: session } = useSession()

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push("/")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link href={session ? "/dashboard" : "/"} className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">
              占い自動鑑定システム
            </span>
          </Link>
        </div>
        
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          {session ? (
            <>
              <nav className="flex items-center space-x-6 text-sm font-medium">
                <Link href="/dashboard" className="transition-colors hover:text-foreground/80">
                  ダッシュボード
                </Link>
                <Link href="/fortune" className="transition-colors hover:text-foreground/80">
                  占いを始める
                </Link>
                <Link href="/history" className="transition-colors hover:text-foreground/80">
                  鑑定履歴
                </Link>
              </nav>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm">
                  <CreditCard className="h-4 w-4" />
                  <span>クレジット: {session.user.credits || 0}</span>
                </div>
                
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  {session.user.name}
                </Button>
                
                <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
                  <LogOut className="h-4 w-4" />
                  ログアウト
                </Button>
              </div>
            </>
          ) : (
            <nav className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" size="sm">ログイン</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">新規登録</Button>
              </Link>
            </nav>
          )}
        </div>
      </div>
    </header>
  )
}