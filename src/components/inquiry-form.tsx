"use client"

import { useState } from "react"
import { Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

type InquiryFormProps = {
  yachtId: string
  yachtName: string
}

type FormState = {
  customerName: string
  email: string
  phone: string
  message: string
}

const initialState: FormState = {
  customerName: "",
  email: "",
  phone: "",
  message: "",
}

export function InquiryForm({ yachtId, yachtName }: InquiryFormProps) {
  const [formState, setFormState] = useState<FormState>(initialState)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setSuccess("")
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          yachtId,
          ...formState,
        }),
      })

      const payload = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(payload.error ?? "提交询盘失败，请稍后再试。")
      }

      setSuccess(`已收到您的询盘！我们的销售顾问将会在 24 小时内与您联系。`)
      setFormState(initialState)
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "提交询盘失败，请稍后再试。"
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  function updateField<Key extends keyof FormState>(field: Key, value: FormState[Key]) {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const inputClasses = "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
  const textareaClasses = "flex min-h-[100px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50"

  if (success) {
     return (
        <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
           <div className="rounded-full bg-emerald-100 p-3">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
           </div>
           <div>
              <p className="font-semibold text-slate-900 text-lg">提交成功</p>
              <p className="text-slate-500 text-sm mt-1">{success}</p>
           </div>
           <Button variant="outline" className="mt-4" onClick={() => setSuccess("")}>
              发送新的询盘
           </Button>
        </div>
     )
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-4">
        
        {error && (
          <div className="flex items-center gap-3 rounded-md bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-slate-700">姓名 <span className="text-red-500">*</span></label>
            <input
              required
              placeholder="您的姓名"
              value={formState.customerName}
              onChange={(event) => updateField("customerName", event.target.value)}
              className={inputClasses}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-slate-700">电话 <span className="text-red-500">*</span></label>
            <input
              required
              placeholder="您的联系电话"
              value={formState.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              className={inputClasses}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium leading-none text-slate-700">邮箱 <span className="text-red-500">*</span></label>
          <input
            required
            type="email"
            placeholder="您的电子邮箱"
            value={formState.email}
            onChange={(event) => updateField("email", event.target.value)}
            className={inputClasses}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium leading-none text-slate-700">留言内容 <span className="text-red-500">*</span></label>
          <textarea
            required
            placeholder={`我对 ${yachtName} 很感兴趣，希望能获取更多资料...`}
            value={formState.message}
            onChange={(event) => updateField("message", event.target.value)}
            className={textareaClasses}
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-brand-600 hover:bg-brand-500 text-white"
        size="lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            提交中...
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            提交询盘
          </>
        )}
      </Button>
      <p className="text-xs text-center text-slate-400">我们将对您的信息严格保密</p>
    </form>
  )
}
