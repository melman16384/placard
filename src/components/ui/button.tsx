import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium tracking-tight transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40',
          {
            'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow focus-visible:ring-blue-500': variant === 'primary',
            'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 focus-visible:ring-blue-400': variant === 'secondary',
            'bg-red-500 text-white hover:bg-red-600 shadow-sm focus-visible:ring-red-500': variant === 'danger',
            'text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-400': variant === 'ghost',
          },
          {
            'px-3 py-1.5 text-xs gap-1.5': size === 'sm',
            'px-4 py-2 text-sm gap-1.5': size === 'md',
            'px-5 py-2.5 text-sm gap-2': size === 'lg',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
