import { createTRPCRouter } from '@/server/api/trpc'
import { fortuneRouter } from '@/server/routers/fortune'

export const appRouter = createTRPCRouter({
  fortune: fortuneRouter,
})

export type AppRouter = typeof appRouter

export const createCaller = createTRPCRouter.createCaller