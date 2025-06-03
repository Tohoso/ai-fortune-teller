"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { api } from "@/lib/trpc/client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface FortuneType {
  id: string
  name: string
  description: string | null
  required_credits: number
  input_schema: {
    required: string[]
    optional?: string[]
    fields?: Record<string, any>
  }
}

interface FortuneFormProps {
  fortuneType: FortuneType
}

// 基本的な入力スキーマ
const baseSchema = z.object({
  name: z.string().min(1, "お名前を入力してください"),
  birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "正しい日付形式で入力してください"),
  gender: z.enum(["male", "female", "other"], {
    required_error: "性別を選択してください"
  }),
  consultation: z.string().max(500, "相談内容は500文字以内で入力してください"),
})

// 動的にスキーマを拡張する関数
function createDynamicSchema(fortuneType: FortuneType) {
  const schema = baseSchema
  const requiredFields = fortuneType.input_schema.required || []
  const optionalFields = fortuneType.input_schema.optional || []

  // タロット占い用の追加フィールド
  if (requiredFields.includes('question_type')) {
    return schema.extend({
      question_type: z.enum(["love", "work", "money", "health", "general"], {
        required_error: "質問カテゴリを選択してください"
      }),
      birthtime: optionalFields.includes('birthtime') 
        ? z.string().optional()
        : z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "正しい時刻形式で入力してください").optional(),
      birthplace: optionalFields.includes('birthplace')
        ? z.string().optional()
        : z.string().optional(),
    })
  }

  // 西洋占星術・四柱推命用（出生時刻必須）
  if (requiredFields.includes('birthtime')) {
    return schema.extend({
      birthtime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "正しい時刻形式で入力してください"),
      birthplace: requiredFields.includes('birthplace')
        ? z.string().min(1, "出生地を入力してください")
        : z.string().optional(),
    })
  }

  // 九星気学用（基本スキーマのみ）
  return schema.extend({
    birthtime: z.string().optional(),
    birthplace: z.string().optional(),
  })
}

export function FortuneForm({ fortuneType }: FortuneFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const schema = createDynamicSchema(fortuneType)
  type FormData = z.infer<typeof schema>

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      birthdate: "",
      gender: undefined,
      consultation: "",
      birthtime: "",
      birthplace: "",
      question_type: undefined,
    } as any,
  })

  const createFortune = api.fortune.create.useMutation({
    onSuccess: (data) => {
      router.push(`/dashboard?success=申込が完了しました`)
    },
    onError: (error) => {
      setError(error.message)
      setIsLoading(false)
    }
  })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setError(null)

    try {
      await createFortune.mutateAsync({
        fortuneTypeId: fortuneType.id,
        inputData: data
      })
    } catch (error) {
      // エラーはonErrorで処理される
    }
  }

  const requiredFields = fortuneType.input_schema.required || []
  const optionalFields = fortuneType.input_schema.optional || []

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{fortuneType.name} - 申込フォーム</CardTitle>
        <CardDescription>
          {fortuneType.description}
          <br />
          <span className="text-sm text-blue-600 font-medium">
            必要クレジット: {fortuneType.required_credits}
          </span>
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {/* お名前 */}
          <div className="space-y-2">
            <Label htmlFor="name">お名前 *</Label>
            <Input
              id="name"
              {...form.register("name")}
              disabled={isLoading}
              placeholder="山田太郎"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>

          {/* 生年月日 */}
          <div className="space-y-2">
            <Label htmlFor="birthdate">生年月日 *</Label>
            <Input
              id="birthdate"
              type="date"
              {...form.register("birthdate")}
              disabled={isLoading}
            />
            {form.formState.errors.birthdate && (
              <p className="text-sm text-red-500">{form.formState.errors.birthdate.message}</p>
            )}
          </div>

          {/* 出生時刻（必要な場合） */}
          {(requiredFields.includes('birthtime') || optionalFields.includes('birthtime')) && (
            <div className="space-y-2">
              <Label htmlFor="birthtime">
                出生時刻 {requiredFields.includes('birthtime') ? '*' : '（わかる場合）'}
              </Label>
              <Input
                id="birthtime"
                type="time"
                {...form.register("birthtime")}
                disabled={isLoading}
                placeholder="10:30"
              />
              {form.formState.errors.birthtime && (
                <p className="text-sm text-red-500">{form.formState.errors.birthtime.message}</p>
              )}
            </div>
          )}

          {/* 出生地（必要な場合） */}
          {(requiredFields.includes('birthplace') || optionalFields.includes('birthplace')) && (
            <div className="space-y-2">
              <Label htmlFor="birthplace">
                出生地 {requiredFields.includes('birthplace') ? '*' : '（わかる場合）'}
              </Label>
              <Input
                id="birthplace"
                {...form.register("birthplace")}
                disabled={isLoading}
                placeholder="東京都新宿区"
              />
              {form.formState.errors.birthplace && (
                <p className="text-sm text-red-500">{form.formState.errors.birthplace.message}</p>
              )}
            </div>
          )}

          {/* 性別 */}
          <div className="space-y-2">
            <Label>性別 *</Label>
            <Select
              value={form.watch("gender")}
              onValueChange={(value: "male" | "female" | "other") => form.setValue("gender", value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="性別を選択してください" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">男性</SelectItem>
                <SelectItem value="female">女性</SelectItem>
                <SelectItem value="other">その他</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.gender && (
              <p className="text-sm text-red-500">{form.formState.errors.gender.message}</p>
            )}
          </div>

          {/* 質問カテゴリ（タロット占い用） */}
          {requiredFields.includes('question_type') && (
            <div className="space-y-2">
              <Label>質問カテゴリ *</Label>
              <Select
                value={form.watch("question_type")}
                onValueChange={(value: "love" | "work" | "money" | "health" | "general") => 
                  form.setValue("question_type", value)
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="カテゴリを選択してください" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="love">恋愛</SelectItem>
                  <SelectItem value="work">仕事</SelectItem>
                  <SelectItem value="money">金運</SelectItem>
                  <SelectItem value="health">健康</SelectItem>
                  <SelectItem value="general">総合</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.question_type && (
                <p className="text-sm text-red-500">{form.formState.errors.question_type.message}</p>
              )}
            </div>
          )}

          {/* 相談内容 */}
          <div className="space-y-2">
            <Label htmlFor="consultation">
              {requiredFields.includes('question_type') ? '具体的な質問' : '相談内容'} *
            </Label>
            <Textarea
              id="consultation"
              {...form.register("consultation")}
              disabled={isLoading}
              placeholder={
                requiredFields.includes('question_type') 
                  ? "タロットに聞きたいことを具体的にお書きください"
                  : "具体的なお悩みや知りたいことをお書きください"
              }
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              {form.watch("consultation")?.length || 0}/500文字
            </p>
            {form.formState.errors.consultation && (
              <p className="text-sm text-red-500">{form.formState.errors.consultation.message}</p>
            )}
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
              className="flex-1"
            >
              戻る
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "申込中..." : `申込する（${fortuneType.required_credits}クレジット）`}
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  )
}