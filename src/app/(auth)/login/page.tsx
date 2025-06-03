import { AuthForm } from "@/components/forms/auth-form"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <AuthForm mode="login" />
    </div>
  )
}