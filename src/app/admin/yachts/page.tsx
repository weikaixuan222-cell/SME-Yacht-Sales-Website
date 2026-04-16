import { Anchor, AlertCircle, Plus } from "lucide-react"

import { AdminFrame } from "@/components/admin-frame"
import { AdminYachtManager } from "@/components/admin-yacht-manager"
import { isDatabaseConfigured } from "@/lib/prisma"
import { requireAdminPageSession } from "@/server/admin-auth"
import { listAdminYachts } from "@/server/admin-yachts"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

export default async function AdminYachtsPage() {
  const session = await requireAdminPageSession("/admin/yachts")

  if (!isDatabaseConfigured()) {
    return (
      <AdminFrame 
         title="游艇资产管理" 
         activeMenu="yachts"
      >
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
           <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <h2 className="text-lg font-semibold text-red-900">数据库未配置</h2>
           </div>
           <p className="mt-2 text-sm text-red-700 max-w-md">当前环境尚未配置数据库连接，因此还不能读取或编辑真实游艇数据。请先启动本地 PostgreSQL，并配置 DATABASE_URL。</p>
        </div>
      </AdminFrame>
    )
  }

  const yachts = await listAdminYachts()

  return (
    <AdminFrame 
      title="游艇资产管理" 
      description="管理在售和草稿游艇。只有发布为非草稿的游艇才会展示在前台列表中。"
      sessionEmail={session.email}
      activeMenu="yachts"
    >
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Pass yachts down to the existing component, which we will modify in the next step */}
        <AdminYachtManager yachts={yachts} />
      </div>
    </AdminFrame>
  )
}
