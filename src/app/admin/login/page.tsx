import { redirect } from "next/navigation"
import { Anchor, AlertCircle, Info } from "lucide-react"

import { AdminLoginForm } from "@/components/admin-login-form"
import { getAdminAuthConfigError, getAdminSession } from "@/server/admin-auth"

type AdminLoginPageProps = {
  searchParams: Promise<{
    next?: string
    loggedOut?: string
  }>
}

function sanitizeNextPath(nextPath: string | undefined) {
  if (!nextPath || !nextPath.startsWith("/admin")) {
    return "/admin/yachts"
  }
  return nextPath
}

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = await searchParams
  const nextPath = sanitizeNextPath(params.next)
  const loggedOut = params.loggedOut === "1"
  const session = await getAdminSession()

  if (session) {
    redirect(nextPath)
  }

  const configError = getAdminAuthConfigError()

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 border shadow-lg relative -top-3">
             <Anchor className="text-white h-7 w-7" />
          </div>
          <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-slate-900">
            后台系统登录
          </h2>
          <p className="mt-2 text-center text-sm text-slate-500">
            管理游艇资产与客户询盘数据
          </p>
        </div>
        
        <div className="bg-white px-8 py-10 shadow-sm border border-slate-200 sm:rounded-[var(--radius-xl)] rounded-xl relative z-10">
           {configError ? (
             <div className="rounded-lg bg-amber-50 p-4 mb-6">
               <div className="flex">
                 <div className="flex-shrink-0">
                   <AlertCircle className="h-5 w-5 text-amber-400" aria-hidden="true" />
                 </div>
                 <div className="ml-3">
                   <h3 className="text-sm font-medium text-amber-800">数据库环境未就绪</h3>
                   <div className="mt-2 text-sm text-amber-700">
                     <p>{configError}。请先完成环境变量配置并重新启动。</p>
                   </div>
                 </div>
               </div>
             </div>
           ) : (
             <>
               <div className="mb-6 flex items-start gap-3 rounded-lg bg-slate-50 p-4 border border-slate-100">
                  <Info className="h-5 w-5 text-brand-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-600 leading-relaxed">
                     本地演示可直接使用 seed 写入的默认账号。<br />详见 `.env.example`。
                  </p>
               </div>
               <AdminLoginForm nextPath={nextPath} loggedOut={loggedOut} />
             </>
           )}
        </div>
      </div>
    </div>
  )
}
