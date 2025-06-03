import { NextRequest, NextResponse } from "next/server"
import { fortuneQueue } from "@/lib/queue/fortune-queue"

// キューの状態監視用API（開発環境のみ）
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 })
  }

  try {
    const waiting = await fortuneQueue.waiting()
    const active = await fortuneQueue.active()
    const completed = await fortuneQueue.completed()
    const failed = await fortuneQueue.failed()
    const delayed = await fortuneQueue.delayed()

    return NextResponse.json({
      queue: {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
      },
      jobs: {
        waiting: waiting.map(job => ({
          id: job.id,
          data: job.data,
          createdAt: job.timestamp,
        })),
        active: active.map(job => ({
          id: job.id,
          data: job.data,
          progress: job.progress(),
          createdAt: job.timestamp,
        })),
        failed: failed.map(job => ({
          id: job.id,
          data: job.data,
          error: job.failedReason,
          createdAt: job.timestamp,
        })),
      }
    })
  } catch (error) {
    console.error("Queue status error:", error)
    return NextResponse.json({ error: "Queue status check failed" }, { status: 500 })
  }
}

// 手動でジョブを再実行する用（開発環境のみ）
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 })
  }

  try {
    const { action, jobId } = await request.json()

    if (action === "retry" && jobId) {
      const job = await fortuneQueue.getJob(jobId)
      if (job) {
        await job.retry()
        return NextResponse.json({ message: "Job retried successfully" })
      }
    }

    if (action === "clean") {
      await fortuneQueue.clean(24 * 60 * 60 * 1000) // 24時間前の完了・失敗ジョブを削除
      return NextResponse.json({ message: "Queue cleaned successfully" })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Queue action error:", error)
    return NextResponse.json({ error: "Queue action failed" }, { status: 500 })
  }
}