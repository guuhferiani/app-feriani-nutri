import * as React from "react"
import { cn } from "@/lib/utils"

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "destructive" | "success" }
>(({ className, variant = "default", ...props }, ref) => {
  const variants = {
    default: "bg-slate-50 text-slate-800 border-slate-200",
    destructive: "bg-red-50 text-red-800 border-red-200/80 [&>svg]:text-red-600",
    success: "bg-emerald-50 text-emerald-800 border-emerald-200/80 [&>svg]:text-emerald-600",
  }

  return (
    <div
      ref={ref}
      role="alert"
      className={cn(
        "relative w-full rounded-xl border p-4 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg~*]:pl-7",
        variants[variant],
        className
      )}
      {...props}
    />
  )
})
Alert.displayName = "Alert"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertDescription }
