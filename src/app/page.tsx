import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Ship, Shield, MapPin } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <main className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] w-full bg-slate-900 border-b">
        <div className="absolute inset-0 overflow-hidden">
          {/* Placeholder for high quality image */}
          <div className="absolute inset-0 bg-slate-900/60 z-10" />
          <div className="w-full h-full bg-gradient-to-r from-brand-900 to-slate-900 opacity-80" />
        </div>
        
        <div className="relative z-20 mx-auto flex h-full max-w-6xl flex-col items-start justify-center px-6">
          <div className="max-w-2xl space-y-6">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              探索属于您的<br />完美航海生活
            </h1>
            <p className="text-lg leading-8 text-slate-300">
              我们为中小型企业及高净值个人提供一站式游艇交易与咨询服务。从豪华新艇到精选二手，为您精准匹配。
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 w-full sm:w-auto">
              <Button asChild size="lg" className="w-full sm:w-auto bg-brand-600 text-white hover:bg-brand-500 rounded-full cursor-pointer">
                <Link href="/yachts">
                  查看在售游艇 <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto bg-transparent text-white border-white/30 hover:bg-white/10 hover:text-white rounded-full cursor-pointer">
                <Link href="/contact">
                  联系销售顾问
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="bg-slate-50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">专业、透明的交易体验</h2>
            <p className="mt-4 text-lg text-slate-600">
              我们致力于通过真实可靠的数据及优质的服务，为您提供最省心的购艇体验。
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { title: "海量真实游艇", desc: "严格核实的游艇数据库，每一艘都经过我们专业团队的实地考察。", icon: Ship },
              { title: "全流程保障", desc: "从选品、询盘、合同到交付，提供全链路交易安全与合规保障。", icon: Shield },
              { title: "本地化服务", desc: "在核心地区设有展示和对接网点，提供完善的售后与托管方案。", icon: MapPin },
            ].map((prop) => (
              <div key={prop.title} className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:shadow-md">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <prop.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-slate-900">{prop.title}</h3>
                <p className="text-slate-600 leading-relaxed">{prop.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="bg-white py-24 border-t">
         <div className="mx-auto max-w-6xl px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">准备好开启下一段旅程了吗？</h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-slate-600">
              无论您是首次购艇，还是寻求升级换代，我们的专家团队随时准备为您服务。
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
               <Button asChild size="lg" className="w-full sm:w-auto bg-brand-600 hover:bg-brand-500 rounded-full cursor-pointer">
                  <Link href="/yachts">浏览游艇列表</Link>
               </Button>
            </div>
         </div>
      </section>
    </main>
  )
}
