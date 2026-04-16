import { AlertCircle, User, MessageSquare, Ship, Calendar } from "lucide-react"

import { AdminFrame } from "@/components/admin-frame"
import { isDatabaseConfigured } from "@/lib/prisma"
import { requireAdminPageSession } from "@/server/admin-auth"
import { listAdminInquiries } from "@/server/admin-inquiries"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

export default async function AdminInquiriesPage() {
  const session = await requireAdminPageSession("/admin/inquiries")

  if (!isDatabaseConfigured()) {
    return (
      <AdminFrame 
         title="询盘数据查询" 
         activeMenu="inquiries"
      >
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
           <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <h2 className="text-lg font-semibold text-red-900">数据库未配置</h2>
           </div>
           <p className="mt-2 text-sm text-red-700 max-w-md">当前环境尚未配置数据库连接，因此还不能读取真实询盘数据。请先启动本地 PostgreSQL，并配置 DATABASE_URL。</p>
        </div>
      </AdminFrame>
    )
  }

  const inquiries = await listAdminInquiries()

  return (
    <AdminFrame 
      title="询盘数据查询" 
      description="按照真实时间倒序展示全站的用户询盘，方便及时跟进高意向客户。"
      sessionEmail={session.email}
      activeMenu="inquiries"
    >
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
           <h3 className="font-semibold text-slate-900">最新收件箱</h3>
           <Badge variant="secondary">{inquiries.length} 条记录</Badge>
        </div>
        
        {inquiries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <MessageSquare className="h-10 w-10 text-slate-300 mb-3" />
            <p className="font-medium text-slate-900 mb-1">暂无客户询盘</p>
            <p className="text-sm text-slate-500">前台页面产生的用户留言记录将展示在此处。</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {inquiries.map((inquiry) => (
              <li key={inquiry.id} className="p-6 transition hover:bg-slate-50/50">
                <div className="flex flex-col md:flex-row gap-6">
                   {/* Left Col: Customer Info */}
                   <div className="w-full md:w-64 shrink-0 space-y-3">
                      <div className="flex items-center gap-2">
                         <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                            <span className="font-bold text-sm">{inquiry.customerName.charAt(0).toUpperCase()}</span>
                         </div>
                         <h4 className="font-semibold text-slate-900">{inquiry.customerName}</h4>
                      </div>
                      <div className="text-sm text-slate-600 space-y-1 ml-10">
                         <p>{inquiry.email}</p>
                         <p>{inquiry.phone}</p>
                      </div>
                   </div>
                   
                   {/* Right Col: Content & Yacht Info */}
                   <div className="flex-1 space-y-4 border-l-2 border-brand-50 pl-4 md:pl-6">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                         <div className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                            <Ship className="h-3.5 w-3.5" />
                            {inquiry.yacht.name} ({inquiry.yacht.brand} / {inquiry.yacht.model})
                         </div>
                         <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(inquiry.createdAt).toLocaleString("zh-CN", { hour12: false })}
                         </div>
                      </div>
                      <p className="text-sm leading-relaxed text-slate-700">
                        {inquiry.message}
                      </p>
                   </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminFrame>
  )
}
