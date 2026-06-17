'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SubscribeButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function handleSubscribe() {
    setLoading(true); setMsg(null)
    try {
      const res = await fetch('/api/graph/subscribe', { method: 'POST' })
      const data = await res.json()
      const ok = data.results?.filter((r: { status: string }) => r.status === 'subscribed').length ?? 0
      const err = data.results?.filter((r: { status: string }) => r.status === 'error').length ?? 0
      setMsg(`${ok} abonniert${err > 0 ? `, ${err} Fehler` : ''}`)
      router.refresh()
    } catch {
      setMsg('Fehler')
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-3">
      {msg && <span className="text-xs text-gray-500">{msg}</span>}
      <Button size="sm" variant="secondary" onClick={handleSubscribe} disabled={loading}>
        <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
        Webhooks erneuern
      </Button>
    </div>
  )
}
