"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { Plus, Edit2, Trash2, CheckCircle2, AlertCircle, Loader2, Save, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

type AdminYacht = {
  id: string
  name: string
  brand: string
  model: string
  year: number
  price: number
  length: number
  capacity: number
  condition: "NEW" | "USED"
  location: string
  description: string
  coverImage: string
  galleryImages: string[]
  status: "DRAFT" | "AVAILABLE" | "SOLD"
  inquiryCount: number
}

type AdminYachtManagerProps = {
  yachts: AdminYacht[]
}

type YachtFormState = {
  name: string
  brand: string
  model: string
  year: string
  price: string
  length: string
  capacity: string
  condition: "NEW" | "USED"
  location: string
  description: string
  coverImage: string
  galleryImagesText: string
  status: "DRAFT" | "AVAILABLE" | "SOLD"
}

const emptyFormState: YachtFormState = {
  name: "",
  brand: "",
  model: "",
  year: "",
  price: "",
  length: "",
  capacity: "",
  condition: "USED",
  location: "",
  description: "",
  coverImage: "",
  galleryImagesText: "",
  status: "DRAFT",
}

function yachtToFormState(yacht: AdminYacht): YachtFormState {
  return {
    name: yacht.name,
    brand: yacht.brand,
    model: yacht.model,
    year: String(yacht.year),
    price: String(yacht.price),
    length: String(yacht.length),
    capacity: String(yacht.capacity),
    condition: yacht.condition,
    location: yacht.location,
    description: yacht.description,
    coverImage: yacht.coverImage,
    galleryImagesText: yacht.galleryImages.join("\n"),
    status: yacht.status,
  }
}

export function AdminYachtManager({ yachts }: AdminYachtManagerProps) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formState, setFormState] = useState<YachtFormState>(emptyFormState)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  
  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!editingId) return
    const yacht = yachts.find((item) => item.id === editingId)
    if (!yacht) {
      setEditingId(null)
      setFormState(emptyFormState)
      setIsFormVisible(false)
    }
  }, [editingId, yachts])

  function updateField<Key extends keyof YachtFormState>(field: Key, value: YachtFormState[Key]) {
    setFormState((current) => ({ ...current, [field]: value }))
  }

  function startCreate() {
    setEditingId(null)
    setFormState(emptyFormState)
    setFeedback(null)
    setIsFormVisible(true)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  function startEdit(yacht: AdminYacht) {
    setEditingId(yacht.id)
    setFormState(yachtToFormState(yacht))
    setFeedback(null)
    setIsFormVisible(true)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  function cancelEdit() {
     setEditingId(null)
     setFormState(emptyFormState)
     setFeedback(null)
     setIsFormVisible(false)
  }

  async function refreshAfterMutation(successMessage: string) {
    router.refresh()
    setFeedback({ type: "success", message: successMessage })
    setTimeout(() => setFeedback(null), 3000)
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploadingImage(true)
    setFeedback(null)
    
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = (await response.json()) as { url?: string; error?: string }

      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "图片上传失败")
      }

      updateField("coverImage", data.url)
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "上传图片时发生异常",
      })
    } finally {
      setIsUploadingImage(false)
      event.target.value = '' // Reset input
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setFeedback(null)

    const payload = {
      name: formState.name,
      brand: formState.brand,
      model: formState.model,
      year: Number(formState.year),
      price: Number(formState.price),
      length: Number(formState.length),
      capacity: Number(formState.capacity),
      condition: formState.condition,
      location: formState.location,
      description: formState.description,
      coverImage: formState.coverImage,
      galleryImages: formState.galleryImagesText.split(/\r?\n/).map((i) => i.trim()).filter(Boolean),
      status: formState.status,
    }

    const targetUrl = editingId ? `/api/yachts/${editingId}` : "/api/yachts"
    const method = editingId ? "PUT" : "POST"

    try {
      const response = await fetch(targetUrl, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = (await response.json()) as { error?: string }

      if (!response.ok) throw new Error(result.error ?? "操作失败，请稍后再试。")

      setEditingId(null)
      setFormState(emptyFormState)
      setIsFormVisible(false)
      await refreshAfterMutation(editingId ? "游艇数据已成功更新" : "游艇已成发布")
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "操作异常，请稍后再试。",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("确定要删除这条游艇数据吗？此操作无法撤销。")) return
    
    setDeletingId(id)
    setFeedback(null)

    try {
      const response = await fetch(`/api/yachts/${id}`, { method: "DELETE" })
      const result = (await response.json()) as { error?: string }

      if (!response.ok) throw new Error(result.error ?? "删除失败，请稍后再试。")

      if (editingId === id) {
        setEditingId(null)
        setFormState(emptyFormState)
        setIsFormVisible(false)
      }

      await refreshAfterMutation("游艇已永久删除")
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "删除失败，请稍后再试。",
      })
    } finally {
      setDeletingId(null)
    }
  }

  const inputClass = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50"

  return (
    <div className="space-y-0">
      
      {/* Toast Feedback */}
      {feedback && !isFormVisible && (
         <div className={`mx-6 mt-6 p-4 rounded-md flex items-center gap-3 ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
            {feedback.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            <p className="text-sm font-medium">{feedback.message}</p>
         </div>
      )}

      {/* Editor Form Modal / Inline Block */}
      {isFormVisible && (
         <div ref={formRef} className="border-b border-slate-200 bg-slate-50 p-6 md:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                 <h2 className="text-lg font-bold text-slate-900">{editingId ? "编辑游艇信息" : "新建游艇资产"}</h2>
                 <p className="text-sm text-slate-500">完善游艇数据，标清状态后方可发布到前台。</p>
              </div>
              <Button variant="ghost" size="icon" onClick={cancelEdit}>
                 <X className="h-5 w-5" />
              </Button>
            </div>
            
            {feedback && isFormVisible && (
               <div className={`mb-6 p-3 rounded-md flex items-center gap-2 text-sm ${feedback.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {feedback.message}
               </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                 <div className="space-y-2 col-span-2">
                    <label className="text-xs font-semibold text-slate-700 uppercase">游艇名称</label>
                    <input required value={formState.name} onChange={(e) => updateField("name", e.target.value)} className={inputClass} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 uppercase">品牌</label>
                    <input required value={formState.brand} onChange={(e) => updateField("brand", e.target.value)} className={inputClass} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 uppercase">型号</label>
                    <input required value={formState.model} onChange={(e) => updateField("model", e.target.value)} className={inputClass} />
                 </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                 <div className="space-y-2 lg:col-span-1">
                    <label className="text-xs font-semibold text-slate-700 uppercase">年份</label>
                    <input type="number" required value={formState.year} onChange={(e) => updateField("year", e.target.value)} className={inputClass} />
                 </div>
                 <div className="space-y-2 md:col-span-2 lg:col-span-2">
                    <label className="text-xs font-semibold text-slate-700 uppercase">价格 (USD)</label>
                    <input type="number" step="0.01" required value={formState.price} onChange={(e) => updateField("price", e.target.value)} className={inputClass} />
                 </div>
                 <div className="space-y-2 lg:col-span-1">
                    <label className="text-xs font-semibold text-slate-700 uppercase">长度 (m)</label>
                    <input type="number" step="0.01" required value={formState.length} onChange={(e) => updateField("length", e.target.value)} className={inputClass} />
                 </div>
                 <div className="space-y-2 lg:col-span-1">
                    <label className="text-xs font-semibold text-slate-700 uppercase">载客人数</label>
                    <input type="number" required value={formState.capacity} onChange={(e) => updateField("capacity", e.target.value)} className={inputClass} />
                 </div>
                 <div className="space-y-2 lg:col-span-1">
                    <label className="text-xs font-semibold text-slate-700 uppercase">新旧度</label>
                    <select value={formState.condition} onChange={(e) => updateField("condition", e.target.value as "NEW" | "USED")} className={inputClass}>
                       <option value="USED">二手</option>
                       <option value="NEW">新艇</option>
                    </select>
                 </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                 <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 uppercase">状态</label>
                    <select value={formState.status} onChange={(e) => updateField("status", e.target.value as "DRAFT" | "AVAILABLE" | "SOLD")} className={inputClass}>
                       <option value="DRAFT">草稿 (仅后台可见)</option>
                       <option value="AVAILABLE">在售 (展示于前台)</option>
                       <option value="SOLD">已售 (展示于前台)</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 uppercase">停泊地</label>
                    <input required value={formState.location} onChange={(e) => updateField("location", e.target.value)} className={inputClass} />
                 </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-200">
                 <div className="space-y-2">
                    <div className="flex items-center justify-between">
                       <label className="text-xs font-semibold text-slate-700 uppercase">封面大图</label>
                       <label className="cursor-pointer text-xs font-semibold text-brand-600 hover:text-brand-700">
                          {isUploadingImage ? <><Loader2 className="inline h-3 w-3 animate-spin"/> 上传中...</> : "本地上传图片"}
                          <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={isUploadingImage} />
                       </label>
                    </div>
                    <input required value={formState.coverImage} onChange={(e) => updateField("coverImage", e.target.value)} className={inputClass} placeholder="输入 URL 或点击上方上传" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 uppercase">图库 URL (每行一个)</label>
                    <textarea required rows={3} value={formState.galleryImagesText} onChange={(e) => updateField("galleryImagesText", e.target.value)} className={inputClass} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 uppercase">详细简介</label>
                    <textarea required rows={5} value={formState.description} onChange={(e) => updateField("description", e.target.value)} className={inputClass} />
                 </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6">
                 <Button type="button" variant="ghost" onClick={cancelEdit} disabled={isSubmitting}>取消</Button>
                 <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
                   {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 保存中</> : <><Save className="mr-2 h-4 w-4" /> {editingId ? "保存更新" : "确认新建"}</>}
                 </Button>
              </div>
            </form>
         </div>
      )}

      {/* Main Data Table Area */}
      <div className="p-6">
         <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <h3 className="font-semibold text-slate-900">资产列表</h3>
               <Badge variant="secondary">{yachts.length} 艘游艇</Badge>
            </div>
            {!isFormVisible && (
               <Button onClick={startCreate} size="sm" className="bg-brand-600 hover:bg-brand-500">
                  <Plus className="mr-2 h-4 w-4" /> 新建游艇
               </Button>
            )}
         </div>

         {yachts.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed rounded-lg border-slate-200">
               <p className="text-slate-500 mb-4">当前还没有可管理的游艇数据。</p>
               <Button onClick={startCreate} variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" /> 立即创建
               </Button>
            </div>
         ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
               <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                     <tr className="text-left text-slate-500">
                        <th className="px-6 py-3 font-medium">游艇与规格</th>
                        <th className="px-6 py-3 font-medium">前台状态</th>
                        <th className="px-6 py-3 font-medium">价格</th>
                        <th className="px-6 py-3 font-medium">询盘数</th>
                        <th className="px-6 py-3 font-medium text-right">操作</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
                     {yachts.map((yacht) => (
                        <tr key={yacht.id} className="transition-colors hover:bg-slate-50 align-top">
                           <td className="px-6 py-4">
                              <p className="font-semibold text-slate-900">{yacht.name}</p>
                              <p className="mt-1 text-xs text-slate-500">{yacht.brand} / {yacht.model} / {yacht.year}</p>
                           </td>
                           <td className="px-6 py-4">
                              <Badge variant={yacht.status === "DRAFT" ? "outline" : yacht.status === "AVAILABLE" ? "success" : "secondary"}>
                                 {yacht.status === "DRAFT" ? "草稿" : yacht.status === "AVAILABLE" ? "在售" : "已售"}
                              </Badge>
                           </td>
                           <td className="px-6 py-4 font-medium">
                              ${yacht.price.toLocaleString("en-US")}
                           </td>
                           <td className="px-6 py-4">
                              <span className={`inline-flex items-center justify-center rounded-full px-2 py-1 text-xs font-semibold ${yacht.inquiryCount > 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                 {yacht.inquiryCount}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                 <Button variant="outline" size="sm" onClick={() => startEdit(yacht)} disabled={isSubmitting || deletingId !== null}>
                                    <Edit2 className="h-4 w-4" />
                                 </Button>
                                 <Button variant="destructive" size="sm" onClick={() => handleDelete(yacht.id)} disabled={deletingId === yacht.id || isSubmitting}>
                                    {deletingId === yacht.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                 </Button>
                              </div>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         )}
      </div>
    </div>
  )
}
