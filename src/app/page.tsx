import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold mb-4">占い自動鑑定システム</h1>
        <p className="text-xl text-muted-foreground">
          本格的な占い鑑定をAIで自動生成
        </p>
        <div className="flex gap-4 justify-center mt-8">
          <Link href="/login">
            <Button size="lg">ログイン</Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="outline">新規登録</Button>
          </Link>
        </div>
      </div>
    </main>
  )
}