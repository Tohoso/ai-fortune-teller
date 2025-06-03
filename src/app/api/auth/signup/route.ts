import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { db } from "@/server/db"

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validatedFields = signupSchema.safeParse(body)

    if (!validatedFields.success) {
      return NextResponse.json(
        { message: "入力内容が正しくありません" },
        { status: 400 }
      )
    }

    const { email, password, name } = validatedFields.data

    // 既存ユーザーのチェック
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: "このメールアドレスは既に登録されています" },
        { status: 409 }
      )
    }

    // パスワードのハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10)

    // ユーザーの作成（初回登録ボーナス3クレジット付与）
    const user = await db.user.create({
      data: {
        email,
        password_hash: hashedPassword,
        name,
        credits: 3, // 初回登録ボーナス
      }
    })

    // クレジット取引の記録
    await db.creditTransaction.create({
      data: {
        user_id: user.id,
        amount: 3,
        type: "bonus",
        description: "新規登録ボーナス"
      }
    })

    return NextResponse.json({
      message: "アカウントが作成されました",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      }
    })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { message: "サーバーエラーが発生しました" },
      { status: 500 }
    )
  }
}