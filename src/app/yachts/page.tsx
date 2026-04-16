import Image from "next/image"
import Link from "next/link"
import { Anchor, MapPin, Users, Maximize, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { isDatabaseConfigured } from "@/lib/prisma"
import { getPublicYachtList } from "@/server/public-yachts"

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

export const dynamic = "force-dynamic"

export default async function YachtsPage() {
  if (!isDatabaseConfigured()) {
    return (
      <main className="mx-auto flex flex-col items-center justify-center min-h-[60vh] max-w-6xl px-6 py-24 text-center">
        <div className="rounded-full bg-red-100 p-4 mb-6">
           <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">数据库未配置</h1>
        <p className="text-slate-600 max-w-md">当前环境尚未配置数据库连接，请先启动 PostgreSQL，并配置 DATABASE_URL。</p>
      </main>
    )
  }

  const yachts = await getPublicYachtList()

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="mb-10 space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">游艇列表</h1>
        <p className="max-w-2xl text-lg text-slate-600">
          浏览我们精选的豪华游艇。从新锐设计到经典二手，每一艘都经过严格甄选，为您的航海生活提供最优解。
        </p>
      </div>

      {yachts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-24 text-center">
          <Anchor className="h-12 w-12 text-slate-400 mb-4" />
          <h2 className="text-xl font-semibold text-slate-900">暂无在售游艇</h2>
          <p className="mt-2 text-slate-600 max-w-md">
            当前展示中心还没有可展示的游艇数据，或请执行数据库种子注入。
          </p>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {yachts.map((yacht) => (
            <Link
              key={yacht.id}
              href={`/yachts/${yacht.id}`}
              className="group flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-slate-200 bg-white transition-all hover:border-[var(--color-brand-200)] hover:shadow-lg"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                <Image
                  src={yacht.coverImage}
                  alt={yacht.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute right-3 top-3 z-10 flex gap-2">
                  <Badge variant={yacht.status === "SOLD" ? "secondary" : "default"} className={yacht.status === "SOLD" ? "" : "bg-brand-600 shadow-sm"}>
                    {yacht.status === "SOLD" ? "已售" : "在售"}
                  </Badge>
                  <Badge variant="secondary" className="bg-white/90 backdrop-blur">
                    {yacht.condition === "NEW" ? "新艇" : "二手"}
                  </Badge>
                </div>
              </div>
              
              <div className="flex flex-1 flex-col p-6">
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <h2 className="line-clamp-1 text-xl font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                    {yacht.name}
                  </h2>
                </div>
                
                <p className="mb-4 text-sm font-medium text-slate-500 uppercase tracking-wider">
                  {yacht.brand} · {yacht.model} · {yacht.year}
                </p>

                <div className="mb-6 grid grid-cols-2 gap-y-3 gap-x-2 text-sm text-slate-600">
                   <div className="flex items-center gap-1.5">
                     <Maximize className="h-4 w-4 text-slate-400" />
                     <span>{yacht.length} m</span>
                   </div>
                   <div className="flex items-center gap-1.5">
                     <Users className="h-4 w-4 text-slate-400" />
                     <span>{yacht.capacity} 人</span>
                   </div>
                   <div className="flex justify-start items-center gap-1.5 col-span-2">
                     <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                     <span className="truncate">{yacht.location}</span>
                   </div>
                </div>

                <div className="mt-auto flex items-end justify-between border-t border-slate-100 pt-5">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">售价</p>
                    <p className="text-xl font-bold text-brand-900">{currencyFormatter.format(yacht.price)}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-brand-600 group-hover:bg-brand-50" asChild>
                    <span>查看详情</span>
                  </Button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
