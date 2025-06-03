"use client"

import { api } from "@/lib/trpc/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, Clock, DollarSign, TrendingUp } from "lucide-react"

export default function AdminDashboard() {
  const { data: stats, isLoading } = api.admin.getDashboardStats.useQuery()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">管理者ダッシュボード</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">管理者ダッシュボード</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              データの取得に失敗しました
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">管理者ダッシュボード</h1>
        <p className="text-muted-foreground">
          {new Date().toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
          })}
        </p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総ユーザー数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              登録済みユーザー
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総申込数</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              累計鑑定申込
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">レビュー待ち</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.pendingReviews.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              確認が必要
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本日の申込</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.todayRequests.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              今日の新規申込
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総売上</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ¥{stats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              クレジット購入合計
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 重要なアクション */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>重要なタスク</CardTitle>
            <CardDescription>
              優先度の高い管理業務
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.pendingReviews > 0 && (
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div>
                  <p className="font-medium text-orange-900">鑑定結果のレビュー</p>
                  <p className="text-sm text-orange-700">
                    {stats.pendingReviews}件の確認が待機中です
                  </p>
                </div>
                <a
                  href="/admin/fortunes"
                  className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
                >
                  確認する
                </a>
              </div>
            )}
            
            {stats.todayRequests > 0 && (
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div>
                  <p className="font-medium text-green-900">本日の申込状況</p>
                  <p className="text-sm text-green-700">
                    今日は{stats.todayRequests}件の新規申込がありました
                  </p>
                </div>
                <a
                  href="/admin/fortunes"
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  詳細確認
                </a>
              </div>
            )}
            
            {stats.pendingReviews === 0 && stats.todayRequests === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>現在、緊急のタスクはありません</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>クイックアクセス</CardTitle>
            <CardDescription>
              よく使用する管理機能
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <a
              href="/admin/fortunes"
              className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium">鑑定結果管理</div>
              <div className="text-sm text-muted-foreground">
                AI生成結果の確認・編集・承認
              </div>
            </a>
            
            <a
              href="/admin/users"
              className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium">ユーザー管理</div>
              <div className="text-sm text-muted-foreground">
                ユーザー一覧・クレジット調整
              </div>
            </a>
            
            <a
              href="/api/queue"
              className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              target="_blank"
            >
              <div className="font-medium">キュー監視</div>
              <div className="text-sm text-muted-foreground">
                AI生成ジョブの状態確認（開発用）
              </div>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}