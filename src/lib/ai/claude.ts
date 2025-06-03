import Anthropic from "@anthropic-ai/sdk"
import { env } from "@/env"
import { createFortunePrompt, type PromptData } from "./prompts"

export const claude = new Anthropic({
  apiKey: env.CLAUDE_API_KEY,
})

export interface FortuneGenerationData {
  fortuneType: string
  name: string
  birthdate: string
  birthtime?: string
  birthplace?: string
  gender: "male" | "female" | "other"
  consultation: string
  questionType?: "love" | "work" | "money" | "health" | "general"
}

export async function generateFortune(data: FortuneGenerationData): Promise<string> {
  const promptData: PromptData = {
    fortuneType: data.fortuneType,
    name: data.name,
    birthdate: data.birthdate,
    birthtime: data.birthtime,
    birthplace: data.birthplace,
    gender: data.gender,
    consultation: data.consultation,
    questionType: data.questionType,
  }
  
  const prompt = createFortunePrompt(promptData)
  
  try {
    const response = await claude.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    })

    if (response.content[0]?.type === "text") {
      return response.content[0].text
    }
    
    throw new Error("AIからの応答が予期しない形式です")
  } catch (error) {
    console.error("AI生成エラー:", error)
    throw new Error("AI生成に失敗しました")
  }
}

