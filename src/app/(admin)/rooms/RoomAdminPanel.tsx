'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Plus, X, Check, ExternalLink, RefreshCw, Wifi, WifiOff, FlaskConical, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AMENITY_LABELS } from '@/lib/utils'
import Link from 'next/link'

interface Room {
  id: string
  name: string
  capacity: number
  floor: string | null
  amenities: string[]
  description: string | null
  color: string
  msEmail: string | null
  graphSubscriptionId: string | null
  subscriptionExpiry: Date | null
  _count: { bookings: number }
}

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#84CC16']
const ALL_AMENITIES = Object.keys(AMENITY_LABELS)
const emptyForm = { name: '', capacity: 6, floor: '', amenities: [] as string[], description: '', color: '#3B82F6', msEmail: '' }

export function RoomAdminPanel({ rooms: initialRooms }: { rooms: Room[] }) {
  const router = useRouter()
  const [rooms, setRooms] = useState(initialRooms)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [subscribing, setSubscribing] = useState(false)
  const [subscribeMsg, setSubscribeMsg] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; msg: string } | 'loading'>>({})

  async function handleTest(roomId: string) {
    setTestResults((p) => ({ ...p, [roomId]: 'loading' }))
    const res = await fetch(`/api/rooms/${roomId}/test`)
    const data = await res.json()
    setTestResults((p) => ({
      ...p,
      [roomId]: data.ok
        ? { ok: true, msg: `OK — ${data.eventsToday} Termin(e) heute (${data.latencyMs} ms)` }
        : { ok: false, msg: data.error || 'Fehler' },
    }))
  }

  function startCreate() { setForm(emptyForm); setEditingId(null); setShowForm(true) }

  function startEdit(room: Room) {
    setForm({ name: room.name, capacity: room.capacity, floor: room.floor || '', amenities: room.amenities, description: room.description || '', color: room.color, msEmail: room.msEmail || '' })
    setEditingId(room.id); setShowForm(true)
  }

  function toggleAmenity(a: string) {
    setForm((f) => ({ ...f, amenities: f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a] }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true)
    const body = { ...form, capacity: Number(form.capacity), msEmail: form.msEmail || null }
    const res = editingId
      ? await fetch(`/api/rooms/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      : await fetch('/api/rooms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setLoading(false)
    if (res.ok) {
      const updated = await res.json()
      if (editingId) setRooms((p) => p.map((r) => r.id === editingId ? { ...r, ...updated } : r))
      else setRooms((p) => [...p, { ...updated, _count: { bookings: 0 } }])
      setShowForm(false); router.refresh()
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/rooms/${id}`, { method: 'DELETE' })
    if (res.ok) { setRooms((p) => p.filter((r) => r.id !== id)); setDeleteId(null) }
  }

  async function handleSubscribeAll() {
    setSubscribing(true); setSubscribeMsg(null)
    const res = await fetch('/api/graph/subscribe', { method: 'POST' })
    const data = await res.json()
    const ok = data.results?.filter((r: { status: string }) => r.status === 'subscribed').length ?? 0
    const err = data.results?.filter((r: { status: string }) => r.status === 'error').length ?? 0
    setSubscribeMsg(`${ok} abonniert${err > 0 ? `, ${err} Fehler` : ''}`)
    setSubscribing(false); router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {rooms.some((r) => r.msEmail) && (
            <Button variant="secondary" size="sm" onClick={handleSubscribeAll} disabled={subscribing}>
              <RefreshCw className={`w-4 h-4 mr-1.5 ${subscribing ? 'animate-spin' : ''}`} />
              Webhooks aktivieren
            </Button>
          )}
          {subscribeMsg && <span className="text-sm text-gray-500">{subscribeMsg}</span>}
        </div>
        <Button onClick={startCreate}>
          <Plus className="w-4 h-4 mr-1" />
          Raum hinzufügen
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">{editingId ? 'Raum bearbeiten' : 'Neuer Raum'}</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input id="name" label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <Input id="capacity" label="Kapazität" type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input id="floor" label="Etage" value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} placeholder="z.B. 2. OG" />
              <Input id="description" label="Beschreibung" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Microsoft Exchange</p>
              <Input id="msEmail" label="Raumkonto E-Mail" value={form.msEmail} onChange={(e) => setForm({ ...form, msEmail: e.target.value })} placeholder="konferenzraum-a@firma.de" type="email" />
              <p className="text-xs text-blue-600">Kalender-Events werden direkt aus Exchange gelesen</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Farbe</p>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button key={c} type="button" className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110" style={{ backgroundColor: c, borderColor: form.color === c ? 'rgba(0,0,0,0.4)' : 'transparent' }} onClick={() => setForm({ ...form, color: c })} />
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Ausstattung</p>
              <div className="flex flex-wrap gap-2">
                {ALL_AMENITIES.map((a) => (
                  <button key={a} type="button" onClick={() => toggleAmenity(a)} className={`px-3 py-1 rounded-full text-sm border transition-colors ${form.amenities.includes(a) ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'}`}>
                    {AMENITY_LABELS[a]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>{loading ? 'Speichern...' : editingId ? 'Speichern' : 'Erstellen'}</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Abbrechen</Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Raum</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Exchange Konto</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Test</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Webhook</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Kapazität</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Display</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => {
              const subActive = room.subscriptionExpiry && new Date(room.subscriptionExpiry) > new Date()
              return (
                <tr key={room.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: room.color }} />
                      <span className="font-medium text-gray-900">{room.name}</span>
                      {room.floor && <span className="text-xs text-gray-400">{room.floor}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {room.msEmail
                      ? <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded">{room.msEmail}</span>
                      : <span className="text-xs text-gray-400">— nicht verbunden</span>}
                  </td>
                  <td className="px-4 py-3">
                    {room.msEmail ? (() => {
                      const result = testResults[room.id]
                      if (!result) return (
                        <button onClick={() => handleTest(room.id)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors">
                          <FlaskConical className="w-3.5 h-3.5" />Testen
                        </button>
                      )
                      if (result === 'loading') return <span className="text-xs text-gray-400 animate-pulse">Prüfe…</span>
                      return (
                        <div className="flex items-start gap-1">
                          {result.ok
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                            : <XCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />}
                          <span className={`text-xs leading-tight ${result.ok ? 'text-green-700' : 'text-red-600'}`}>{result.msg}</span>
                        </div>
                      )
                    })() : <span className="text-xs text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {room.msEmail ? (
                      subActive
                        ? <span className="flex items-center gap-1 text-xs text-green-600"><Wifi className="w-3.5 h-3.5" />Aktiv</span>
                        : <span className="flex items-center gap-1 text-xs text-amber-500"><WifiOff className="w-3.5 h-3.5" />Inaktiv</span>
                    ) : <span className="text-xs text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{room.capacity} P.</td>
                  <td className="px-4 py-3">
                    <Link href={`/display/${room.id}`} target="_blank" className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs">
                      <ExternalLink className="w-3.5 h-3.5" />Display
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      {deleteId === room.id ? (
                        <>
                          <span className="text-xs text-red-600">Löschen?</span>
                          <button onClick={() => handleDelete(room.id)} className="text-red-600 hover:text-red-700"><Check className="w-4 h-4" /></button>
                          <button onClick={() => setDeleteId(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(room)} className="text-gray-400 hover:text-blue-600 transition-colors"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => setDeleteId(room.id)} className="text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {rooms.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">Noch keine Räume angelegt</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
