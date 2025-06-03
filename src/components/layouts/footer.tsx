import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
        <div className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          © 2025 占い自動鑑定システム. All rights reserved.
        </div>
        
        <nav className="flex items-center space-x-4 text-sm">
          <Link href="/terms" className="text-muted-foreground hover:underline">
            利用規約
          </Link>
          <Link href="/privacy" className="text-muted-foreground hover:underline">
            プライバシーポリシー
          </Link>
          <Link href="/law" className="text-muted-foreground hover:underline">
            特定商取引法に基づく表記
          </Link>
        </nav>
      </div>
    </footer>
  )
}