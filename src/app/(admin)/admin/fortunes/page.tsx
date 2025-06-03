"use client"

import { useState } from "react"
import { api } from "@/lib/trpc/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Clock, 
  Edit, 
  Eye, 
  CheckCircle, 
  AlertCircle,
  Search,
  RefreshCw,
  FileText
} from "lucide-react"
import Link from "next/link"

type FortuneStatus = "pending_review" | "editing" | "approved" | "published"

const statusConfig = {
  pending_review: {
    label: "レビュー待ち",
    color: "bg-orange-100 text-orange-800",
    icon: Clock
  },
  editing: {
    label: "編集中",
    color: "bg-blue-100 text-blue-800", 
    icon: Edit
  },
  approved: {
    label: "承認済み",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle
  },
  published: {
    label: "公開済み",
    color: "bg-gray-100 text-gray-800",
    icon: FileText
  }
}

export default function FortunesManagementPage() {
  const [status, setStatus] = useState<FortuneStatus | "all">("all")
  const [page, setPage] = useState(1)
  const limit = 20

  const { data, isLoading, error, refetch } = api.admin.getFortuneResults.useQuery({
    status: status === "all" ? undefined : status,
    page,
    limit
  })

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus as FortuneStatus | "all")
    setPage(1)
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">鑑定結果管理</h1>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-red-600">エラーが発生しました</h3>
                <p className="text-muted-foreground">{error.message}</p>
              </div>
              <Button onClick={() => refetch()} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                再試行
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">鑑定結果管理</h1>
          <p className="text-muted-foreground">
            AI生成された鑑定結果の確認・編集・承認
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          更新
        </Button>
      </div>

      {/* フィルター */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">フィルター</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">ステータス</label>
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="pending_review">レビュー待ち</SelectItem>
                  <SelectItem value="editing">編集中</SelectItem>
                  <SelectItem value="approved">承認済み</SelectItem>
                  <SelectItem value="published">公開済み</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 統計サマリー */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(statusConfig).map(([statusKey, config]) => {
            const count = data.results.filter(r => r.status === statusKey).length
            const Icon = config.icon
            return (
              <Card key={statusKey}>
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{config.label}</span>
                  </div>
                  <div className="text-2xl font-bold mt-2">{count}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* 結果一覧 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">鑑定結果一覧</CardTitle>
          <CardDescription>
            {data ? `${data.pagination.total}件中 ${(data.pagination.page - 1) * data.pagination.limit + 1}-${Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)}件を表示` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : data && data.results.length > 0 ? (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>申込情報</TableHead>
                    <TableHead>ユーザー</TableHead>
                    <TableHead>占い種別</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>作成日時</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.results.map((result) => {
                    const config = statusConfig[result.status as FortuneStatus]
                    const Icon = config?.icon || AlertCircle
                    
                    return (
                      <TableRow key={result.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">
                              申込ID: {result.fortune_request.id.slice(0, 8)}...
                            </div>
                            <div className="text-sm text-muted-foreground">
                              AI結果ID: {result.id.slice(0, 8)}...
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{result.fortune_request.user.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {result.fortune_request.user.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {result.fortune_request.fortune_type.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {result.fortune_request.fortune_type.required_credits}クレジット
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={config?.color}>
                            <Icon className="h-3 w-3 mr-1" />
                            {config?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(result.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Link href={`/admin/fortunes/${result.id}`}>
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4 mr-1" />
                                確認
                              </Button>
                            </Link>
                            {(result.status === "pending_review" || result.status === "editing") && (
                              <Link href={`/admin/fortunes/${result.id}/edit`}>
                                <Button size="sm" variant="outline">
                                  <Edit className="h-4 w-4 mr-1" />
                                  編集
                                </Button>
                              </Link>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              {/* ページネーション */}
              {data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-muted-foreground">
                    {data.pagination.total}件中 {(data.pagination.page - 1) * data.pagination.limit + 1}-{Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)}件を表示
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                    >
                      前へ
                    </Button>
                    <div className="flex items-center space-x-1">
                      {[...Array(Math.min(5, data.pagination.totalPages))].map((_, i) => {
                        const pageNum = Math.max(1, page - 2) + i
                        if (pageNum <= data.pagination.totalPages) {
                          return (
                            <Button
                              key={pageNum}
                              variant={pageNum === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setPage(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          )
                        }
                        return null
                      })}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= data.pagination.totalPages}
                    >
                      次へ
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">鑑定結果がありません</h3>
              <p className="text-muted-foreground">
                {status === "all" 
                  ? "まだ鑑定結果が生成されていません。"
                  : `${statusConfig[status as FortuneStatus]?.label}の鑑定結果はありません。`
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}