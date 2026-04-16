import Image from "next/image"
import { notFound } from "next/navigation"
import { Anchor, ArrowLeft, Maximize, Users, MapPin, Calendar, Fingerprint, Ship, AlertCircle } from "lucide-react"
import Link from "next/link"

import { InquiryForm } from "@/components/inquiry-form"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { isDatabaseConfigured } from "@/lib/prisma"
import { getPublicYachtById } from "@/server/public-yachts"

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

type YachtDetailPageProps = {
  params: Promise<{ id: string }>
}

export const dynamic = "force-dynamic"

export default async function YachtDetailPage({ params }: YachtDetailPageProps) {
  if (!isDatabaseConfigured()) {
    return (
      <main className="mx-auto flex flex-col items-center justify-center min-h-[60vh] max-w-6xl px-6 py-24 text-center">
        <div className="rounded-full bg-red-100 p-4 mb-6">
           <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">数据库未配置</h1>
        <p className="text-slate-600 max-w-md">当前环境尚未配置数据库连接，因此还不能读取真实详情数据。</p>
      </main>
    )
  }

  const { id } = await params
  const yacht = await getPublicYachtById(id)

  if (!yacht) {
    notFound()
  }

  return (
    <main className="bg-slate-50 min-h-screen pb-24">
      {/* Breadcrumb / Back Link */}
      <div className="bg-white border-b">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <Button variant="ghost" size="sm" asChild className="text-slate-500 hover:text-slate-900 -ml-3">
             <Link href="/yachts">
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回游艇列表
             </Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 pt-10">
        
        {/* Header Section */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Badge variant={yacht.status === "SOLD" ? "secondary" : "default"} className={yacht.status === "SOLD" ? "" : "bg-brand-600 shadow-sm"}>
                {yacht.status === "SOLD" ? "已售" : "在售"}
              </Badge>
              <Badge variant="outline" className="bg-white">
                {yacht.condition === "NEW" ? "新艇" : "二手"}
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">{yacht.name}</h1>
            <p className="text-lg text-slate-500 uppercase tracking-wide">
              {yacht.brand} · {yacht.model}
            </p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-sm text-slate-500 mb-1">参考售价</p>
            <p className="text-3xl md:text-4xl font-bold text-brand-900">{currencyFormatter.format(yacht.price)}</p>
          </div>
        </div>

        {/* Media & Content Grid */}
        <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          
          <div className="space-y-8">
            {/* Main Carousel / Gallery Area */}
            <div className="space-y-4">
              <div className="overflow-hidden rounded-[var(--radius-lg)] border bg-white shadow-sm aspect-video relative">
                <Image
                  src={yacht.coverImage}
                  alt={yacht.name}
                  fill
                  className="object-cover"
                />
              </div>
              
              {yacht.galleryImages.length > 0 && (
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   {yacht.galleryImages.map((image, idx) => (
                     <div key={idx} className="overflow-hidden rounded-[var(--radius-md)] border bg-white aspect-video relative hover:opacity-90 cursor-pointer transition">
                       <Image
                         src={image}
                         alt={`${yacht.name} interior/exterior detail`}
                         fill
                         className="object-cover"
                       />
                     </div>
                   ))}
                 </div>
              )}
            </div>

            {/* Description */}
            <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">游艇概览</h2>
              <div className="prose prose-slate max-w-none text-slate-600 leading-8">
                {yacht.description.split('\n').map((para, idx) => (
                  <p key={idx}>{para}</p>
                ))}
              </div>
            </section>
          </div>

          {/* Sticky Sidebar */}
          <div className="space-y-6 lg:sticky lg:top-6">
            
            {/* Inquiry Form Card (High Priority CTA) */}
            <div className="rounded-2xl border-2 border-brand-100 bg-white shadow-lg overflow-hidden z-10">
              <div className="bg-brand-50/50 p-6 border-b border-brand-100/50">
                 <h3 className="text-xl font-bold text-slate-900">获取详细信息</h3>
                 <p className="mt-1 text-sm text-slate-500">我们的销售顾问将会在 24 小时内与您联系，并提供完整的手册。</p>
              </div>
              <div className="p-6">
                <InquiryForm yachtId={yacht.id} yachtName={yacht.name} />
              </div>
            </div>

            {/* Specifications Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-5">核心参数</h3>
              
              <ul className="divide-y divide-slate-100 text-sm">
                <li className="flex justify-between py-3">
                  <span className="flex items-center text-slate-500"><Ship className="mr-2 h-4 w-4" /> 品牌</span>
                  <span className="font-medium text-slate-900">{yacht.brand}</span>
                </li>
                <li className="flex justify-between py-3">
                  <span className="flex items-center text-slate-500"><Fingerprint className="mr-2 h-4 w-4" /> 型号</span>
                  <span className="font-medium text-slate-900">{yacht.model}</span>
                </li>
                <li className="flex justify-between py-3">
                  <span className="flex items-center text-slate-500"><Calendar className="mr-2 h-4 w-4" /> 年份</span>
                  <span className="font-medium text-slate-900">{yacht.year}</span>
                </li>
                <li className="flex justify-between py-3">
                  <span className="flex items-center text-slate-500"><Maximize className="mr-2 h-4 w-4" /> 长度</span>
                  <span className="font-medium text-slate-900">{yacht.length} 米</span>
                </li>
                <li className="flex justify-between py-3">
                  <span className="flex items-center text-slate-500"><Users className="mr-2 h-4 w-4" /> 满载</span>
                  <span className="font-medium text-slate-900">{yacht.capacity} 人</span>
                </li>
                <li className="flex justify-between py-3">
                  <span className="flex items-center text-slate-500"><MapPin className="mr-2 h-4 w-4" /> 停泊地</span>
                  <span className="font-medium text-slate-900">{yacht.location}</span>
                </li>
              </ul>
            </div>

          </div>

        </div>
      </div>
    </main>
  )
}
