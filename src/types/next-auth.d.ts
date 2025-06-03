import { type DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: "user" | "admin"
      credits?: number
      permissions?: string[]
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    role: "user" | "admin"
    credits?: number
    permissions?: string[]
  }
}