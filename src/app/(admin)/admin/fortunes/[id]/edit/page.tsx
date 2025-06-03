"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { api } from "@/lib/trpc/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, 
  Save, 
  AlertCircle,
  User,
  FileText,
  Eye,
  RotateCcw,
  Clock
} from "lucide-react"
import Link from "next/link"

export default function FortuneEditPage() {
  const params = useParams()
  const router = useRouter()
  const fortuneResultId = params.id as string
  
  const [editedResult, setEditedResult] = useState("")
  const [editorNotes, setEditorNotes] = useState("")
  const [isModified, setIsModified] = useState(false)

  const { data: result, isLoading, error, refetch } = api.admin.getFortuneResult.useQuery({
    id: fortuneResultId
  })

  const updateMutation = api.admin.updateFortuneResult.useMutation({
    onSuccess: () => {
      router.push(`/admin/fortunes/${fortuneResultId}`)
    },
    onError: (error) => {
      alert("保存に失敗しました: " + error.message)
    }
  })

  // 初期データの設定
  useEffect(() => {
    if (result) {
      const initialResult = result.edited_result || result.raw_result
      setEditedResult(initialResult)
      setEditorNotes(result.editor_notes || "")
    }
  }, [result])

  // 変更検知
  useEffect(() => {
    if (result) {
      const originalResult = result.edited_result || result.raw_result
      const originalNotes = result.editor_notes || ""
      setIsModified(
        editedResult !== originalResult || editorNotes !== originalNotes
      )
    }
  }, [editedResult, editorNotes, result])

  const handleSave = () => {
    if (!editedResult.trim()) {
      alert("鑑定結果を入力してください")
      return
    }

    updateMutation.mutate({
      id: fortuneResultId,
      editedResult: editedResult.trim(),
      editorNotes: editorNotes.trim()
    })
  }

  const handleReset = () => {
    if (result) {
      const originalResult = result.edited_result || result.raw_result
      const originalNotes = result.editor_notes || ""
      setEditedResult(originalResult)
      setEditorNotes(originalNotes)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
          <h1 className="text-3xl font-bold">鑑定結果編集</h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2 animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-96 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/fortunes">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              戻る
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">鑑定結果編集</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-red-600">エラーが発生しました</h3>
                <p className="text-muted-foreground">
                  {error?.message || "鑑定結果が見つかりません"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 編集権限チェック
  if (result.status !== "pending_review" && result.status !== "editing") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/admin/fortunes/${fortuneResultId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              戻る
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">鑑定結果編集</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">編集できません</h3>
                <p className="text-muted-foreground">
                  この鑑定結果は現在編集できない状態です。
                </p>
              </div>
              <Link href={`/admin/fortunes/${fortuneResultId}`}>
                <Button variant="outline">
                  詳細画面に戻る
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/admin/fortunes/${fortuneResultId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              戻る
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">鑑定結果編集</h1>
            <p className="text-muted-foreground">
              ID: {result.id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-100 text-blue-800">
            <Clock className="h-3 w-3 mr-1" />
            編集モード
          </Badge>
          {isModified && (
            <Badge variant="outline" className="text-orange-600 border-orange-300">
              未保存の変更あり
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* サイドバー - 申込情報 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" />
                申込者情報
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <Label className="text-xs font-medium text-muted-foreground">お名前</Label>
                <p className="font-medium">{result.fortune_request.user.name}</p>
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground">占い種別</Label>
                <p>{result.fortune_request.fortune_type.name}</p>
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground">申込日時</Label>
                <p>{formatDate(result.fortune_request.created_at)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">入力データ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {Object.entries(result.fortune_request.input_data as Record<string, any>).map(([key, value]) => (
                <div key={key} className="border-b border-gray-100 pb-2 last:border-b-0">
                  <Label className="text-xs font-medium text-muted-foreground capitalize">
                    {getFieldLabel(key)}
                  </Label>
                  <p className="break-words">
                    {typeof value === 'string' ? value : JSON.stringify(value)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 操作ボタン */}
          <div className="space-y-2">
            <Button 
              onClick={handleSave}
              disabled={!isModified || updateMutation.isLoading}
              className="w-full"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isLoading ? "保存中..." : "保存"}
            </Button>
            
            <Button 
              onClick={handleReset}
              disabled={!isModified}
              variant="outline"
              className="w-full"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              リセット
            </Button>
            
            <Link href={`/admin/fortunes/${fortuneResultId}`} className="block">
              <Button variant="ghost" className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                プレビュー
              </Button>
            </Link>
          </div>
        </div>

        {/* メインエディタ */}
        <div className="lg:col-span-3 space-y-6">
          {/* 元の結果（参考用） */}
          {result.edited_result && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">元のAI生成結果（参考）</CardTitle>
                <CardDescription>
                  編集前の元の結果です。参考としてご確認ください。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {result.raw_result}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 編集エリア */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">鑑定結果編集</CardTitle>
              <CardDescription>
                AI生成された鑑定結果を確認・編集してください。マークダウン記法が使用できます。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="edited-result">鑑定結果 *</Label>
                <Textarea
                  id="edited-result"
                  value={editedResult}
                  onChange={(e) => setEditedResult(e.target.value)}
                  className="min-h-[500px] font-mono text-sm mt-2"
                  placeholder="鑑定結果を入力してください..."
                />
                <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                  <span>{editedResult.length.toLocaleString()}文字</span>
                  <span>Ctrl+Z で元に戻す</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 編集メモ */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">編集メモ</CardTitle>
              <CardDescription>
                編集内容や理由についてのメモを記録できます（他の管理者も確認できます）
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="editor-notes">編集メモ（任意）</Label>
                <Textarea
                  id="editor-notes"
                  value={editorNotes}
                  onChange={(e) => setEditorNotes(e.target.value)}
                  className="min-h-[120px] mt-2"
                  placeholder="編集の理由や注意点など..."
                />
                <div className="text-xs text-muted-foreground mt-2">
                  {editorNotes.length}/500文字
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 編集ガイドライン */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-base text-blue-800">編集ガイドライン</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-700 space-y-2">
              <ul className="list-disc list-inside space-y-1">
                <li>占い結果の本質的な内容は変更せず、表現や文章構成を改善してください</li>
                <li>誤字脱字、不自然な表現、読みにくい箇所を修正してください</li>
                <li>相談者に寄り添う温かい表現を心がけてください</li>
                <li>具体的で実践的なアドバイスになるよう調整してください</li>
                <li>文字数は2000-3500文字を目安に調整してください</li>
                <li>重要な変更をした場合は編集メモに理由を記載してください</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function getFieldLabel(key: string): string {
  const labels: Record<string, string> = {
    name: "お名前",
    birthdate: "生年月日", 
    birthtime: "出生時刻",
    birthplace: "出生地",
    gender: "性別",
    consultation: "相談内容",
    question_type: "質問カテゴリ"
  }
  return labels[key] || key
}