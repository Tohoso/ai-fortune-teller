import Queue from "bull"
import { env } from "@/env"
import { generateFortune, type FortuneGenerationData } from "@/lib/ai/claude"
import { db } from "@/server/db"

// Redisキューの初期化
export const fortuneQueue = new Queue("fortune generation", {
  redis: {
    port: 6379,
    host: new URL(env.REDIS_URL).hostname,
    password: new URL(env.REDIS_URL).password || undefined,
  },
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 5,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  },
})

export interface FortuneJobData {
  fortuneRequestId: string
  fortuneType: string
  inputData: FortuneGenerationData
}

// AI生成ジョブの処理
fortuneQueue.process(async (job) => {
  const { fortuneRequestId, fortuneType, inputData } = job.data as FortuneJobData
  
  try {
    console.log(`AI生成開始: ${fortuneRequestId}`)
    
    // AI生成実行
    const aiResult = await generateFortune({
      ...inputData,
      fortuneType,
    })
    
    // 結果をデータベースに保存
    await db.aiResult.create({
      data: {
        fortune_request_id: fortuneRequestId,
        raw_result: aiResult,
        status: "pending_review", // 管理者レビュー待ち
        created_at: new Date(),
        updated_at: new Date(),
      },
    })
    
    // 申込ステータスを更新
    await db.fortuneRequest.update({
      where: { id: fortuneRequestId },
      data: {
        status: "ai_generated",
        updated_at: new Date(),
      },
    })
    
    console.log(`AI生成完了: ${fortuneRequestId}`)
    
    // TODO: 管理者への通知メール送信
    // await sendAdminNotification(fortuneRequestId)
    
    return { success: true, fortuneRequestId }
    
  } catch (error) {
    console.error(`AI生成エラー: ${fortuneRequestId}`, error)
    
    // エラー時のステータス更新
    await db.fortuneRequest.update({
      where: { id: fortuneRequestId },
      data: {
        status: "failed",
        updated_at: new Date(),
      },
    })
    
    throw error
  }
})

// ジョブをキューに追加する関数
export async function addFortuneGenerationJob(jobData: FortuneJobData) {
  const job = await fortuneQueue.add(jobData, {
    priority: 1,
    delay: 0,
  })
  
  console.log(`ジョブ追加: ${job.id} for request ${jobData.fortuneRequestId}`)
  return job.id
}

// キューの状態監視
fortuneQueue.on("completed", (job, result) => {
  console.log(`ジョブ完了: ${job.id}`, result)
})

fortuneQueue.on("failed", (job, err) => {
  console.error(`ジョブ失敗: ${job?.id}`, err)
})

fortuneQueue.on("stalled", (job) => {
  console.warn(`ジョブスタック: ${job.id}`)
})

// 開発環境でのキュー管理UI用（Bull Dashboard）
export { fortuneQueue as default }