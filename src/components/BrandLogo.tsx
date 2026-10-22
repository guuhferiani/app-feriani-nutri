import React from 'react'
import { Leaf } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg'
  showSubtitle?: boolean
  className?: string
  title?: string
  highlightTitle?: string
  subtitle?: string
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className,
  title = 'Feriani',
  highlightTitle = 'Nutri',
  subtitle = 'Gestão Nutricional Integrada',
}) => {
  const iconSizes = {
    sm: 'w-8 h-8 rounded-lg p-1.5',
    md: 'w-11 h-11 rounded-xl p-2.5',
    lg: 'w-14 h-14 rounded-2xl p-3',
  }

  const iconInner = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  const titleSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  }

  return (
    <div className={cn('flex items-center gap-3 select-none', className)}>
      <div
        className={cn(
          'relative flex items-center justify-center bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-700/20 ring-4 ring-emerald-500/10 transition-transform duration-300 hover:scale-105 shrink-0',
          iconSizes[size]
        )}
      >
        <Leaf className={cn('text-emerald-50 fill-white/20', iconInner[size])} />
        {/* Glow point */}
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-300 rounded-full animate-ping opacity-75" />
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full" />
      </div>

      <div className="flex flex-col min-w-0">
        <span
          className={cn(
            'font-bold tracking-tight text-slate-900 font-sans leading-none flex items-center gap-1.5',
            titleSizes[size]
          )}
        >
          <span>{title}</span>
          <span className="text-emerald-600 font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            {highlightTitle}
          </span>
        </span>
        {showSubtitle && (
          <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-800/70 mt-1 truncate">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  )
}
