import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { db } from "@/server/db"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const validatedFields = loginSchema.safeParse(credentials)

        if (!validatedFields.success) {
          return null
        }

        const { email, password } = validatedFields.data

        // 一般ユーザー認証を試行
        const user = await db.user.findUnique({
          where: { email }
        })

        if (user && user.password_hash) {
          const passwordsMatch = await bcrypt.compare(password, user.password_hash)
          if (passwordsMatch) {
            // セッション用にクレジット残高も含める
            const userWithCredits = await db.user.findUnique({
              where: { id: user.id },
              select: {
                id: true,
                email: true,
                name: true,
                credits: true,
              }
            })

            return {
              id: user.id,
              email: user.email,
              name: user.name,
              credits: userWithCredits?.credits || 0,
              role: "user" as const,
            }
          }
        }

        // 管理者認証を試行
        const admin = await db.admin.findUnique({
          where: { email }
        })

        if (admin && admin.password_hash && admin.is_active) {
          const passwordsMatch = await bcrypt.compare(password, admin.password_hash)
          if (passwordsMatch) {
            return {
              id: admin.id,
              email: admin.email,
              name: admin.name,
              role: "admin" as const,
              permissions: admin.permissions,
            }
          }
        }

        return null
      }
    })
  ],
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as "user" | "admin"
        session.user.credits = token.credits as number
        if (token.role === "admin") {
          session.user.permissions = token.permissions as string[]
        }
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.credits = user.credits
        if (user.role === "admin") {
          token.permissions = user.permissions
        }
      }
      return token
    }
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt"
  },
  secret: process.env.NEXTAUTH_SECRET,
})