import { Mail, Phone, MapPin, Clock } from "lucide-react"

export default function ContactPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-16">
      
      <div className="mb-16 max-w-2xl text-center mx-auto">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl mb-6">联系我们</h1>
        <p className="text-lg leading-8 text-slate-600">
          无论您是对某款游艇感兴趣，还是需要专业的维护托管建议，我们的专家团队都随时准备为您提供帮助。
        </p>
      </div>

      <div className="grid gap-12 lg:grid-cols-2">
        {/* Contact Info Cards */}
        <div className="space-y-6">
           <h2 className="text-2xl font-bold text-slate-900 mb-6">获取专属咨询服务</h2>
           
           <div className="flex gap-4 p-6 rounded-2xl border border-slate-200 bg-white">
             <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <Phone className="h-5 w-5" />
             </div>
             <div>
                <h3 className="font-semibold text-slate-900">销售热线</h3>
                <p className="mt-1 text-slate-600 text-sm">工作时间，专业顾问直接为您解答疑问。</p>
                <p className="mt-2 text-lg font-medium text-brand-900">+852 0000 0000</p>
             </div>
           </div>

           <div className="flex gap-4 p-6 rounded-2xl border border-slate-200 bg-white">
             <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <Mail className="h-5 w-5" />
             </div>
             <div>
                <h3 className="font-semibold text-slate-900">电子邮件</h3>
                <p className="mt-1 text-slate-600 text-sm">给我们发送邮件，我们将在一个工作日内给您回执。</p>
                <p className="mt-2 text-base font-medium text-brand-900 hover:underline cursor-pointer">sales@sme-yachts-mock.com</p>
             </div>
           </div>

           <div className="flex gap-4 p-6 rounded-2xl border border-slate-200 bg-white">
             <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600">
                <Clock className="h-5 w-5" />
             </div>
             <div>
                <h3 className="font-semibold text-slate-900">工作时间</h3>
                <p className="mt-1 text-slate-500 text-sm">
                  周一至周五: 09:00 - 18:00 (GMT+8)
                  <br />周末及节假日: 轮流值班
                </p>
             </div>
           </div>
        </div>

        {/* Office Location */}
        <div className="space-y-6">
           <h2 className="text-2xl font-bold text-slate-900 mb-6">我们的办公地址</h2>
           
           <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="aspect-[4/3] w-full bg-slate-100 flex items-center justify-center text-slate-400">
                {/* 占位地图卡片 */}
                 <div className="text-center">
                    <MapPin className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="text-sm border border-slate-200 rounded-lg px-4 py-2 bg-white text-slate-500 shadow-sm">大中华区联合展示中心</p>
                 </div>
              </div>
              <div className="p-6">
                 <h3 className="text-lg font-semibold text-slate-900">香港 / 深圳 办公室展示区</h3>
                 <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    本地址为系统演示用占位地址。实际项目中可嵌入 Google Maps 或相关的高清实景照片。
                 </p>
              </div>
           </div>
        </div>
      </div>
    </main>
  )
}
