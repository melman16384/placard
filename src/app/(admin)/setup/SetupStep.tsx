'use client'

import { CheckCircle2, Circle } from 'lucide-react'

interface Props {
  number: number
  title: string
  description: string
  done: boolean
  optional?: boolean
  children: React.ReactNode
}

export function SetupStep({ number, title, description, done, optional, children }: Props) {
  return (
    <div className={`rounded-xl border ${done ? 'border-green-200 bg-white' : 'border-gray-200 bg-white'}`}>
      <div className="px-6 py-4 flex items-start gap-4 border-b border-gray-100">
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {done ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : number}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-900">{title}</h2>
            {optional && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Optional</span>}
            {done && <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">Erledigt</span>}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}
