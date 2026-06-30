'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PlacardLogo } from '@/components/PlacardLogo'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError('E-Mail oder Passwort falsch')
      return
    }

    router.push('/rooms')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #F2F3FF 0%, #F8F9FF 50%, #F0F4FF 100%)' }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <PlacardLogo size={56} className="mb-4 drop-shadow-md" />
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Placard</h1>
          <p className="text-gray-500 text-sm mt-1">Admin-Bereich</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="email"
              label="E-Mail"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="name@firma.de"
              autoComplete="email"
              required
            />
            <Input
              id="password"
              label="Passwort"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? 'Anmelden...' : 'Anmelden'}
            </Button>
          </form>
        </div>

      </div>
    </div>
  )
}
