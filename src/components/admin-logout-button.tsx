"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { LogOut, Loader2 } from "lucide-react"

export function AdminLogoutButton() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleLogout() {
    setIsSubmitting(true)

    try {
      await fetch("/api/admin/session", {
        method: "DELETE",
      })
    } finally {
      router.replace("/admin/login?loggedOut=1")
      router.refresh()
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isSubmitting}
      className="flex w-full items-center justify-center gap-2 rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isSubmitting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
      <span>{isSubmitting ? "退出中..." : "退出登录"}</span>
    </button>
  )
}
