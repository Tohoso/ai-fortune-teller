import { createTRPCRouter } from '@/server/api/trpc'

export const appRouter = createTRPCRouter({
  // ここにルーターを追加していきます
})

export type AppRouter = typeof appRouter

export const createCaller = createTRPCRouter.createCaller