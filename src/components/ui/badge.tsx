import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "destructive" | "success";
}

function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  let classes = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
  
  if (variant === "default") {
    classes += " border-transparent bg-slate-900 text-slate-50 shadow hover:bg-slate-900/80"
  } else if (variant === "secondary") {
    classes += " border-transparent bg-slate-100 text-slate-900 hover:bg-slate-100/80"
  } else if (variant === "outline") {
    classes += " text-slate-950 border-slate-200"
  } else if (variant === "destructive") {
    classes += " border-transparent bg-red-500 text-slate-50 shadow hover:bg-red-500/80"
  } else if (variant === "success") {
    classes += " border-transparent bg-emerald-100 text-emerald-800 hover:bg-emerald-100/80"
  }

  return (
    <div className={`${classes} ${className}`} {...props} />
  )
}

export { Badge }
