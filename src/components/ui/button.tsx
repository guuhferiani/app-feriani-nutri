import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", isLoading, children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]"

    const variants = {
      default:
        "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800 hover:shadow-emerald-600/20 hover:shadow-md",
      destructive:
        "bg-red-500 text-white shadow-sm hover:bg-red-600 active:bg-red-700",
      outline:
        "border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-emerald-50/50 hover:text-emerald-700 hover:border-emerald-300",
      secondary:
        "bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80 active:bg-emerald-200",
      ghost:
        "text-slate-700 hover:bg-emerald-50/60 hover:text-emerald-700",
      link:
        "text-emerald-600 underline-offset-4 hover:underline hover:text-emerald-700 p-0 h-auto font-medium",
    }

    const sizes = {
      default: "h-11 px-5 py-2.5",
      sm: "h-9 rounded-md px-3.5 text-xs",
      lg: "h-12 rounded-xl px-8 text-base",
      icon: "h-10 w-10",
    }

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }
