import Link from "next/link"
import { Anchor, Ship, MessageSquare, AlertCircle } from "lucide-react"
import { ReactNode } from "react"

import { AdminLogoutButton } from "@/components/admin-logout-button"

type AdminFrameProps = {
  title: string
  description?: string
  sessionEmail?: string
  children: ReactNode
  activeMenu: "yachts" | "inquiries"
}

export function AdminFrame({ title, description, sessionEmail, children, activeMenu }: AdminFrameProps) {
  return (
    <div className="flex min-h-[calc(100vh-80px)] w-full flex-col bg-slate-50 md:flex-row">
      {/* Backend Sidebar */}
      <aside className="w-full shrink-0 border-r border-slate-200 bg-slate-900 px-6 py-8 text-slate-300 md:w-64 md:flex md:flex-col">
        <div className="mb-8 flex items-center gap-3 text-white">
          <Anchor className="h-6 w-6" />
          <span className="text-lg font-bold tracking-wide">Yacht Admin</span>
        </div>
        
        <nav className="flex flex-1 flex-col gap-2">
          <Link
            href="/admin/yachts"
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
              activeMenu === "yachts" ? "bg-brand-600 text-white shadow" : "hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Ship className="h-5 w-5" />
            <span className="font-medium text-sm">游艇资产管理</span>
          </Link>
          <Link
            href="/admin/inquiries"
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
              activeMenu === "inquiries" ? "bg-brand-600 text-white shadow" : "hover:bg-slate-800 hover:text-white"
            }`}
          >
            <MessageSquare className="h-5 w-5" />
            <span className="font-medium text-sm">询盘数据查询</span>
          </Link>
        </nav>

        {sessionEmail && (
          <div className="mt-8 border-t border-slate-700 pt-6">
            <div className="mb-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
               当前会话
            </div>
            <p className="truncate text-sm text-slate-400 mb-4">{sessionEmail}</p>
            <AdminLogoutButton />
          </div>
        )}
      </aside>

      {/* Backend Main Content */}
      <main className="flex-1 overflow-y-auto px-6 py-8 md:px-10 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 border-b border-slate-200 pb-5">
            <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
            {description && <p className="mt-2 text-sm text-slate-500">{description}</p>}
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}
