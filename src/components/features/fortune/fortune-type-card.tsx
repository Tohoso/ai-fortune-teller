import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreditCard } from "lucide-react"

interface FortuneType {
  id: string
  name: string
  description: string | null
  required_credits: number
  input_schema: any
}

interface FortuneTypeCardProps {
  fortuneType: FortuneType
}

export function FortuneTypeCard({ fortuneType }: FortuneTypeCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-xl">{fortuneType.name}</CardTitle>
        <CardDescription>{fortuneType.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col justify-between flex-1">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CreditCard className="h-4 w-4" />
            <span>{fortuneType.required_credits}クレジット</span>
          </div>
          
          <div className="text-sm">
            <h4 className="font-medium mb-2">必要な情報：</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              {fortuneType.input_schema?.required?.map((field: string) => (
                <li key={field}>
                  {getFieldLabel(field, fortuneType.input_schema.fields)}
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="pt-4">
          <Link href={`/fortune/${fortuneType.id}`} className="w-full">
            <Button className="w-full">この占いを始める</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

function getFieldLabel(fieldName: string, fields?: any): string {
  const fieldLabels: Record<string, string> = {
    name: 'お名前',
    birthdate: '生年月日',
    birthtime: '出生時刻',
    birthplace: '出生地',
    gender: '性別',
    consultation: '相談内容',
    question_type: '質問カテゴリ'
  }

  if (fields && fields[fieldName] && fields[fieldName].label) {
    return fields[fieldName].label
  }

  return fieldLabels[fieldName] || fieldName
}