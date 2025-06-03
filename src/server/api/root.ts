import { createTRPCRouter } from '@/server/api/trpc'
import { fortuneRouter } from '@/server/routers/fortune'
import { adminRouter } from '@/server/routers/admin'

export const appRouter = createTRPCRouter({
  fortune: fortuneRouter,
  admin: adminRouter,
})

export type AppRouter = typeof appRouter

export const createCaller = createTRPCRouter.createCaller