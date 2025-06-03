"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  BarChart3,
  Eye,
} from "lucide-react"

interface AdminSidebarProps {
  user: {
    permissions?: string[]
  }
}

const navigationItems = [
  {
    name: "ダッシュボード",
    href: "/admin",
    icon: LayoutDashboard,
    permission: null, // 全管理者アクセス可能
  },
  {
    name: "鑑定結果管理",
    href: "/admin/fortunes",
    icon: FileText,
    permission: "fortune:review",
  },
  {
    name: "ユーザー管理",
    href: "/admin/users",
    icon: Users,
    permission: "user:manage",
  },
  {
    name: "レポート",
    href: "/admin/reports",
    icon: BarChart3,
    permission: "system:config",
  },
  {
    name: "システム設定",
    href: "/admin/settings",
    icon: Settings,
    permission: "system:config",
  },
  {
    name: "ユーザー画面確認",
    href: "/",
    icon: Eye,
    permission: null,
    external: true,
  },
]

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname()
  const userPermissions = user.permissions || []

  // 権限チェック
  const hasPermission = (permission: string | null) => {
    if (!permission) return true
    return userPermissions.includes(permission) || userPermissions.includes("*")
  }

  // アクセス可能なナビゲーション項目をフィルタリング
  const accessibleItems = navigationItems.filter(item => hasPermission(item.permission))

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-73px)]">
      <nav className="p-4 space-y-2">
        {accessibleItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          if (item.external) {
            return (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                )}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </a>
            )
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-blue-100 text-blue-900"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
      
      {/* 権限表示 */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="text-xs font-medium text-gray-500 mb-2">権限</h4>
          <div className="space-y-1">
            {userPermissions.includes("*") ? (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                全権限
              </span>
            ) : (
              <div className="flex flex-wrap gap-1">
                {userPermissions.map((permission) => (
                  <span
                    key={permission}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {getPermissionName(permission)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}

function getPermissionName(permission: string): string {
  const permissionNames: Record<string, string> = {
    "fortune:review": "鑑定確認",
    "fortune:approve": "鑑定承認",
    "user:manage": "ユーザー管理",
    "admin:manage": "管理者管理",
    "system:config": "システム設定",
  }
  
  return permissionNames[permission] || permission
}