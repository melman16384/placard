import { cn } from '@/lib/utils'
import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-gray-600">
            {label}
          </label>
        )}
        <input
          id={id}
          ref={ref}
          className={cn(
            'block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 transition-all placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/15 disabled:bg-gray-50 disabled:text-gray-400',
            error && 'border-red-400 focus:border-red-400 focus:ring-red-500/15',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
