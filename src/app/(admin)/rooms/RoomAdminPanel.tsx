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
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [subscribing, setSubscribing] = useState(false)
  const [renewing, setRenewing] = useState(false)
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

  function startCreate() { setForm(emptyForm); setEditingId(null); setFormError(null); setShowForm(true) }

  function startEdit(room: Room) {
    setForm({ name: room.name, capacity: room.capacity, floor: room.floor || '', amenities: room.amenities, description: room.description || '', color: room.color, msEmail: room.msEmail || '' })
    setEditingId(room.id); setFormError(null); setShowForm(true)
  }

  function toggleAmenity(a: string) {
    setForm((f) => ({ ...f, amenities: f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a] }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setFormError(null)
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
    } else {
      const data = await res.json().catch(() => ({}))
      setFormError(data.error || 'Speichern fehlgeschlagen')
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

  async function handleRenew() {
    setRenewing(true); setSubscribeMsg(null)
    const res = await fetch('/api/graph/subscribe', { method: 'PUT' })
    const data = await res.json()
    const renewed = data.results?.filter((r: { status: string }) => r.status === 'renewed').length ?? 0
    const err = data.results?.filter((r: { status: string }) => r.status === 'error').length ?? 0
    setSubscribeMsg(renewed === 0 ? 'Keine ablaufenden Webhooks' : `${renewed} erneuert${err > 0 ? `, ${err} Fehler` : ''}`)
    setRenewing(false); router.refresh()
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {rooms.some((r) => r.msEmail) && (
            <>
              <Button variant="secondary" size="sm" onClick={handleRenew} disabled={renewing || subscribing}>
                <RefreshCw className={`w-3.5 h-3.5 ${renewing ? 'animate-spin' : ''}`} />
                Webhooks erneuern
              </Button>
              <Button variant="secondary" size="sm" onClick={handleSubscribeAll} disabled={subscribing || renewing}>
                <RefreshCw className={`w-3.5 h-3.5 ${subscribing ? 'animate-spin' : ''}`} />
                Webhooks aktivieren
              </Button>
            </>
          )}
          {subscribeMsg && <span className="text-xs text-gray-400 ml-1">{subscribeMsg}</span>}
        </div>
        <Button size="sm" onClick={startCreate}>
          <Plus className="w-3.5 h-3.5" />
          Raum hinzufügen
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 ring-1 ring-black/[0.03]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900 tracking-tight">{editingId ? 'Raum bearbeiten' : 'Neuer Raum'}</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-300 hover:text-gray-500 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
                {formError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <Input id="name" label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <Input id="capacity" label="Kapazität" type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input id="floor" label="Etage" value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} placeholder="z.B. 2. OG" />
              <Input id="description" label="Beschreibung" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Microsoft Exchange</p>
              <Input id="msEmail" label="Raumkonto E-Mail" value={form.msEmail} onChange={(e) => setForm({ ...form, msEmail: e.target.value })} placeholder="konferenzraum-a@firma.de" type="email" />
              <p className="text-xs text-blue-500">Kalender-Events werden direkt aus Exchange gelesen</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600 mb-2.5">Farbe</p>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c} type="button"
                    className="w-7 h-7 rounded-full transition-all hover:scale-110"
                    style={{ backgroundColor: c, outline: form.color === c ? `3px solid ${c}` : '3px solid transparent', outlineOffset: '2px' }}
                    onClick={() => setForm({ ...form, color: c })}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600 mb-2.5">Ausstattung</p>
              <div className="flex flex-wrap gap-2">
                {ALL_AMENITIES.map((a) => (
                  <button
                    key={a} type="button" onClick={() => toggleAmenity(a)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                      form.amenities.includes(a)
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                    }`}
                  >
                    {AMENITY_LABELS[a]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="submit" disabled={loading}>{loading ? 'Speichern...' : editingId ? 'Speichern' : 'Erstellen'}</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Abbrechen</Button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden ring-1 ring-black/[0.03]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/60">Raum</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/60">Exchange Konto</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/60">Test</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/60">Webhook</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/60">Kap.</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/60">Display</th>
              <th className="px-5 py-3 bg-gray-50/60" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rooms.map((room) => {
              const subActive = room.subscriptionExpiry && new Date(room.subscriptionExpiry) > new Date()
              return (
                <tr key={room.id} className="hover:bg-blue-50/20 transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: room.color }} />
                      <span className="font-medium text-gray-900">{room.name}</span>
                      {room.floor && <span className="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{room.floor}</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {room.msEmail
                      ? <span className="text-xs font-mono text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">{room.msEmail}</span>
                      : <span className="text-xs text-gray-300">nicht verbunden</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    {room.msEmail ? (() => {
                      const result = testResults[room.id]
                      if (!result) return (
                        <button onClick={() => handleTest(room.id)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors">
                          <FlaskConical className="w-3.5 h-3.5" />Testen
                        </button>
                      )
                      if (result === 'loading') return <span className="text-xs text-gray-400 animate-pulse">Prüfe…</span>
                      return (
                        <div className="flex items-start gap-1">
                          {result.ok
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                            : <XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />}
                          <span className={`text-xs leading-tight ${result.ok ? 'text-green-600' : 'text-red-500'}`}>{result.msg}</span>
                        </div>
                      )
                    })() : <span className="text-gray-200">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    {room.msEmail ? (
                      subActive
                        ? <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full"><Wifi className="w-3 h-3" />Aktiv</span>
                        : <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full"><WifiOff className="w-3 h-3" />Inaktiv</span>
                    ) : <span className="text-gray-200">—</span>}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 text-sm">{room.capacity}</td>
                  <td className="px-5 py-3.5">
                    <Link href={`/display/${room.id}`} target="_blank" className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" />Display
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      {deleteId === room.id ? (
                        <>
                          <span className="text-xs text-red-500 mr-1">Löschen?</span>
                          <button onClick={() => handleDelete(room.id)} className="p-1 text-red-500 hover:text-red-700"><Check className="w-4 h-4" /></button>
                          <button onClick={() => setDeleteId(null)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(room)} className="p-1.5 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setDeleteId(room.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {rooms.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-14 text-center">
                  <div className="text-gray-300 text-sm">Noch keine Räume angelegt</div>
                  <button onClick={startCreate} className="mt-3 text-xs text-blue-500 hover:text-blue-700 font-medium">
                    + Ersten Raum erstellen
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
