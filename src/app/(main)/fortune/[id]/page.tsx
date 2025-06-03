"use client"

import { useParams } from "next/navigation"
import { api } from "@/lib/trpc/client"
import { FortuneForm } from "@/components/forms/fortune-form"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

export default function FortuneDetailPage() {
  const params = useParams()
  const fortuneTypeId = params.id as string

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
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-red-600">エラーが発生しました</h2>
          <p className="text-muted-foreground">{error.message}</p>
          <Link href="/fortune">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              占い一覧に戻る
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const fortuneType = fortuneTypes?.find(type => type.id === fortuneTypeId)

  if (!fortuneType) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">占い種別が見つかりません</h2>
          <p className="text-muted-foreground">
            指定された占い種別は存在しないか、現在利用できません。
          </p>
          <Link href="/fortune">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              占い一覧に戻る
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        {/* 戻るリンク */}
        <div>
          <Link href="/fortune">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              占い一覧に戻る
            </Button>
          </Link>
        </div>

        {/* 申し込みフォーム */}
        <FortuneForm fortuneType={fortuneType} />

        {/* 注意事項 */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-yellow-800 mb-3">ご注意事項</h3>
            <ul className="space-y-2 text-sm text-yellow-700">
              <li>• 申し込み完了後、クレジットは即座に消費されます</li>
              <li>• 鑑定結果は管理者の確認後、24時間以内にお届けします</li>
              <li>• 一度申し込まれた内容は変更できません</li>
              <li>• 鑑定結果はマイページからダウンロードできます</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}