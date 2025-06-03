"use client"

import { useSession } from "next-auth/react"
import { api } from "@/lib/trpc/client"
import { FortuneTypeCard } from "@/components/features/fortune/fortune-type-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreditCard, Loader2 } from "lucide-react"
import Link from "next/link"

export default function FortunePage() {
  const { data: session } = useSession()
  const { data: fortuneTypes, isLoading, error } = api.fortune.getTypes.useQuery()

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">エラーが発生しました</h2>
          <p className="text-muted-foreground mt-2">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-8">
        {/* ヘッダーセクション */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">占い種別を選択</h1>
          <p className="text-xl text-muted-foreground">
            あなたに最適な占いをお選びください
          </p>
        </div>

        {/* クレジット残高表示 */}
        {session && (
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <CreditCard className="h-5 w-5" />
                現在のクレジット残高
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-3xl font-bold text-primary">
                {session.user.credits || 0} クレジット
              </div>
              <div className="mt-4">
                <Link href="/payment">
                  <Button variant="outline" size="sm">
                    クレジットを購入
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 占い種別一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fortuneTypes?.map((fortuneType) => (
            <FortuneTypeCard key={fortuneType.id} fortuneType={fortuneType} />
          ))}
        </div>

        {/* 占いが見つからない場合 */}
        {fortuneTypes && fortuneTypes.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <h3 className="text-xl font-semibold mb-2">
                現在利用可能な占いはありません
              </h3>
              <p className="text-muted-foreground">
                新しい占いが追加されるまでお待ちください。
              </p>
            </CardContent>
          </Card>
        )}

        {/* お知らせ */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">🔮 占いについて</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700">
            <ul className="space-y-2 text-sm">
              <li>• 全ての占いは AI（Claude）による自動生成です</li>
              <li>• 管理者が内容を確認・編集してから公開されます</li>
              <li>• 鑑定結果は PDF でダウンロードできます</li>
              <li>• 通常、申込から24時間以内に結果をお届けします</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}