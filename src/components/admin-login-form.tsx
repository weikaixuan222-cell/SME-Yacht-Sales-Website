"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { LogIn, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"

type AdminLoginFormProps = {
  nextPath: string
  loggedOut: boolean
}

export function AdminLoginForm({ nextPath, loggedOut }: AdminLoginFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState("admin@example.com")
  const [password, setPassword] = useState("change-me-please")
  const [feedback, setFeedback] = useState<string | null>(
    loggedOut ? "你已成功退出系统。" : null
  )
  const [isError, setIsError] = useState(!loggedOut)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setFeedback(null)

    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })
      const body = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(body.error ?? "登录失败，请检查账号密码。")
      }

      setIsError(false)
      setFeedback("验证成功，正在进入后台...")
      router.replace(nextPath)
      router.refresh()
    } catch (error) {
      setIsError(true)
      setFeedback(error instanceof Error ? error.message : "登录异常，请稍后重试。")
      setIsSubmitting(false)
    }
  }

  const inputClasses = "mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
          管理员邮箱
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={inputClasses}
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700">
          密码
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={inputClasses}
          disabled={isSubmitting}
        />
      </div>

      {feedback && (
        <div className={`flex items-center gap-2 rounded-md p-3 text-sm ${isError ? "bg-red-50 text-red-700 border border-red-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"}`}>
          {isError ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
          <p>{feedback}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-slate-900 text-white hover:bg-slate-800"
        size="lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            认证中...
          </>
        ) : (
          <>
            <LogIn className="mr-2 h-4 w-4" />
            登录
          </>
        )}
      </Button>
    </form>
  )
}
