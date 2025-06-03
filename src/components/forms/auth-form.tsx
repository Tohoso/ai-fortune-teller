"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { signIn } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

const loginSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください"),
})

const signupSchema = loginSchema.extend({
  name: z.string().min(1, "名前を入力してください"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "パスワードが一致しません",
  path: ["confirmPassword"],
})

type LoginFormData = z.infer<typeof loginSchema>
type SignupFormData = z.infer<typeof signupSchema>

interface AuthFormProps {
  mode: "login" | "signup"
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<LoginFormData | SignupFormData>({
    resolver: zodResolver(mode === "login" ? loginSchema : signupSchema),
    defaultValues: {
      email: "",
      password: "",
      ...(mode === "signup" && { name: "", confirmPassword: "" }),
    },
  })

  const onSubmit = async (data: LoginFormData | SignupFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      if (mode === "signup") {
        // サインアップ処理
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "サインアップに失敗しました")
        }

        // サインアップ成功後、自動的にログイン
        await signIn("credentials", {
          email: data.email,
          password: data.password,
          redirect: false,
        })
        
        router.push("/dashboard")
      } else {
        // ログイン処理
        const result = await signIn("credentials", {
          email: data.email,
          password: data.password,
          redirect: false,
        })

        if (result?.error) {
          throw new Error("メールアドレスまたはパスワードが正しくありません")
        }

        router.push("/dashboard")
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "エラーが発生しました")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{mode === "login" ? "ログイン" : "アカウント作成"}</CardTitle>
        <CardDescription>
          {mode === "login" 
            ? "アカウントにログインしてください" 
            : "新しいアカウントを作成します"}
        </CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="name">お名前</Label>
              <Input
                id="name"
                type="text"
                {...form.register("name" as never)}
                disabled={isLoading}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              type="email"
              {...form.register("email")}
              disabled={isLoading}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              type="password"
              {...form.register("password")}
              disabled={isLoading}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
            )}
          </div>
          
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">パスワード（確認）</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...form.register("confirmPassword" as never)}
                disabled={isLoading}
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-red-500">{form.formState.errors.confirmPassword?.message}</p>
              )}
            </div>
          )}
          
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "処理中..." : mode === "login" ? "ログイン" : "アカウント作成"}
          </Button>
          
          <p className="text-sm text-center text-muted-foreground">
            {mode === "login" ? (
              <>
                アカウントをお持ちでない方は{" "}
                <a href="/register" className="text-primary hover:underline">
                  こちら
                </a>
              </>
            ) : (
              <>
                すでにアカウントをお持ちの方は{" "}
                <a href="/login" className="text-primary hover:underline">
                  こちら
                </a>
              </>
            )}
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}