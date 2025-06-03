"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { api } from "@/lib/trpc/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, 
  Edit, 
  CheckCircle, 
  X, 
  Clock,
  AlertCircle,
  User,
  Calendar,
  CreditCard,
  FileText,
  Save,
  Eye
} from "lucide-react"
import Link from "next/link"

export default function FortuneDetailPage() {
  const params = useParams()
  const router = useRouter()
  const fortuneResultId = params.id as string
  
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [approverNotes, setApproverNotes] = useState("")
  const [rejectReason, setRejectReason] = useState("")

  const { data: result, isLoading, error, refetch } = api.admin.getFortuneResult.useQuery({
    id: fortuneResultId
  })

  const approveMutation = api.admin.approveFortuneResult.useMutation({
    onSuccess: () => {
      refetch()
      setIsApproving(false)
      setApproverNotes("")
    },
    onError: (error) => {
      alert("承認に失敗しました: " + error.message)
    }
  })

  const rejectMutation = api.admin.rejectFortuneResult.useMutation({
    onSuccess: () => {
      refetch()
      setIsRejecting(false)
      setRejectReason("")
    },
    onError: (error) => {
      alert("却下に失敗しました: " + error.message)
    }
  })

  const handleApprove = () => {
    if (!result) return
    
    const finalResult = result.edited_result || result.raw_result
    
    approveMutation.mutate({
      id: fortuneResultId,
      finalResult,
      approverNotes
    })
  }

  const handleReject = () => {
    if (!rejectReason.trim()) {
      alert("却下理由を入力してください")
      return
    }
    
    rejectMutation.mutate({
      id: fortuneResultId,
      reason: rejectReason
    })
  }

  const getStatusInfo = (status: string) => {
    const configs = {
      pending_review: { label: "レビュー待ち", color: "bg-orange-100 text-orange-800", icon: Clock },
      editing: { label: "編集中", color: "bg-blue-100 text-blue-800", icon: Edit },
      approved: { label: "承認済み", color: "bg-green-100 text-green-800", icon: CheckCircle },
      published: { label: "公開済み", color: "bg-gray-100 text-gray-800", icon: FileText }
    }
    return configs[status as keyof typeof configs] || { label: status, color: "bg-gray-100 text-gray-800", icon: AlertCircle }
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
          <h1 className="text-3xl font-bold">鑑定結果詳細</h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
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
          <h1 className="text-3xl font-bold">鑑定結果詳細</h1>
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

  const statusInfo = getStatusInfo(result.status)
  const StatusIcon = statusInfo.icon
  const finalResult = result.edited_result || result.raw_result

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/fortunes">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              戻る
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">鑑定結果詳細</h1>
            <p className="text-muted-foreground">
              ID: {result.id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={statusInfo.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusInfo.label}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 申込情報 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                申込者情報
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">お名前</Label>
                <p className="font-medium">{result.fortune_request.user.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">メールアドレス</Label>
                <p className="text-sm">{result.fortune_request.user.email}</p>
              </div>
              <Separator />
              <div>
                <Label className="text-sm font-medium text-muted-foreground">占い種別</Label>
                <p className="font-medium">{result.fortune_request.fortune_type.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">必要クレジット</Label>
                <div className="flex items-center gap-1">
                  <CreditCard className="h-4 w-4" />
                  <span>{result.fortune_request.fortune_type.required_credits}</span>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">申込日時</Label>
                <div className="flex items-center gap-1 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(result.fortune_request.created_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 入力データ */}
          <Card>
            <CardHeader>
              <CardTitle>入力データ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(result.fortune_request.input_data as Record<string, any>).map(([key, value]) => (
                <div key={key}>
                  <Label className="text-sm font-medium text-muted-foreground capitalize">
                    {getFieldLabel(key)}
                  </Label>
                  <p className="text-sm break-words">
                    {typeof value === 'string' ? value : JSON.stringify(value)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 処理履歴 */}
          <Card>
            <CardHeader>
              <CardTitle>処理履歴</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="font-medium">AI生成完了</span>
                  <span className="text-muted-foreground ml-auto">
                    {formatDate(result.created_at)}
                  </span>
                </div>
                
                {result.edited_at && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="font-medium">編集実施</span>
                    <span className="text-muted-foreground ml-auto">
                      {formatDate(result.edited_at)}
                    </span>
                  </div>
                )}
                
                {result.approved_at && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium">承認完了</span>
                    <span className="text-muted-foreground ml-auto">
                      {formatDate(result.approved_at)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 鑑定結果 */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>鑑定結果</span>
                <div className="flex gap-2">
                  {(result.status === "pending_review" || result.status === "editing") && (
                    <Link href={`/admin/fortunes/${result.id}/edit`}>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4 mr-2" />
                        編集
                      </Button>
                    </Link>
                  )}
                </div>
              </CardTitle>
              <CardDescription>
                {result.edited_result ? "編集済みの結果" : "AI生成結果"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded-lg text-sm">
                  {finalResult}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 編集メモ */}
          {result.editor_notes && (
            <Card>
              <CardHeader>
                <CardTitle>編集メモ</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap bg-blue-50 p-3 rounded">
                  {result.editor_notes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* 承認アクション */}
          {(result.status === "editing" || result.status === "pending_review") && (
            <Card>
              <CardHeader>
                <CardTitle>承認・却下</CardTitle>
                <CardDescription>
                  鑑定結果を確認して承認または却下してください
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isApproving && !isRejecting ? (
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => setIsApproving(true)}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      承認・公開
                    </Button>
                    <Button 
                      onClick={() => setIsRejecting(true)}
                      variant="outline"
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      却下・差し戻し
                    </Button>
                  </div>
                ) : isApproving ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="approver-notes">承認コメント（任意）</Label>
                      <Textarea
                        id="approver-notes"
                        value={approverNotes}
                        onChange={(e) => setApproverNotes(e.target.value)}
                        placeholder="承認に関するコメントがあれば入力してください"
                        className="mt-2"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleApprove}
                        disabled={approveMutation.isLoading}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {approveMutation.isLoading ? "承認中..." : "承認実行"}
                      </Button>
                      <Button 
                        onClick={() => setIsApproving(false)}
                        variant="outline"
                      >
                        キャンセル
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="reject-reason">却下理由 *</Label>
                      <Textarea
                        id="reject-reason"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="却下理由を具体的に入力してください"
                        className="mt-2"
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleReject}
                        disabled={rejectMutation.isLoading}
                        variant="destructive"
                      >
                        <X className="h-4 w-4 mr-2" />
                        {rejectMutation.isLoading ? "却下中..." : "却下実行"}
                      </Button>
                      <Button 
                        onClick={() => setIsRejecting(false)}
                        variant="outline"
                      >
                        キャンセル
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 承認済みの場合の情報 */}
          {result.status === "approved" && result.fortune_result && (
            <Card>
              <CardHeader>
                <CardTitle>承認情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">承認日時</Label>
                  <p className="text-sm">{formatDate(result.approved_at!)}</p>
                </div>
                {result.fortune_result.approver_notes && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">承認コメント</Label>
                    <p className="text-sm bg-green-50 p-2 rounded">
                      {result.fortune_result.approver_notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
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