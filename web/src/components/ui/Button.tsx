import React from 'react'
import { cn } from '../../lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg' | 'icon'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    const variants = {
      default:
        'bg-[#0C52EE] text-white hover:bg-[#0942c4] shadow-sm',
      outline:
        'border border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-900 text-slate-900 shadow-xs',
      secondary:
        'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700',
      ghost:
        'hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 text-zinc-600 dark:text-zinc-400',
      destructive:
        'bg-red-600 text-white hover:bg-red-700 dark:bg-red-900 dark:text-zinc-50 dark:hover:bg-red-800 shadow-xs',
    }

    const sizes = {
      sm: 'h-8 rounded-md px-3 text-xs',
      md: 'h-9 px-4 py-2 text-sm rounded-md',
      lg: 'h-10 rounded-md px-6 text-base',
      icon: 'h-9 w-9 rounded-md flex items-center justify-center p-0',
    }

    return (
      <button
        ref={ref}
        className={cn(
          'emil-press inline-flex items-center justify-center font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
