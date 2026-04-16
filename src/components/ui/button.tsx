import * as React from "react"
import { Slot } from "@radix-ui/react-slot"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: "default" | "outline" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // Base classes
    let classes = "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
    
    // Variant classes
    if (variant === "default") {
      classes += " bg-brand-600 text-white shadow hover:bg-brand-600/90"
    } else if (variant === "destructive") {
       classes += " bg-red-600 text-white shadow hover:bg-red-700 hover:text-white"
    } else if (variant === "outline") {
      classes += " border border-slate-200 bg-white shadow-sm hover:bg-slate-100 hover:text-slate-900"
    } else if (variant === "ghost") {
      classes += " hover:bg-slate-100 hover:text-slate-900"
    } else if (variant === "link") {
      classes += " text-slate-900 underline-offset-4 hover:underline"
    }
    
    // Size classes
    if (size === "default") {
      classes += " h-9 px-4 py-2 rounded-md"
    } else if (size === "sm") {
      classes += " h-8 rounded-md px-3 text-xs"
    } else if (size === "lg") {
      classes += " h-10 rounded-md px-8"
    } else if (size === "icon") {
      classes += " h-9 w-9 rounded-md"
    }
    
    return (
      <Comp
        className={`${classes} ${className}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
