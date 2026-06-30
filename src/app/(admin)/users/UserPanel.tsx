'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, X, Check, Pencil, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/utils'

interface User {
  id: string
  name: string | null
  email: string
  role: 'ADMIN' | 'USER'
  createdAt: Date
}

const emptyForm = { name: '', email: '', password: '' }

export function UserPanel({ users: initial, currentUserId }: { users: User[]; currentUserId: string }) {
  const router = useRouter()
  const [users, setUsers] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function startCreate() { setForm(emptyForm); setEditingId(null); setError(null); setShowForm(true) }
  function startEdit(u: User) { setForm({ name: u.name ?? '', email: u.email, password: '' }); setEditingId(u.id); setError(null); setShowForm(true) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError(null)

    const body: Record<string, string> = { name: form.name, email: form.email }
    if (form.password) body.password = form.password

    const res = editingId
      ? await fetch(`/api/admin/users/${editingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      : await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, password: form.password }) })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setError(data.error); return }

    if (editingId) setUsers((p) => p.map((u) => u.id === editingId ? { ...u, ...data } : u))
    else setUsers((p) => [...p, data])
    setShowForm(false); router.refresh()
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setDeleteId(null); return }
    setUsers((p) => p.filter((u) => u.id !== id)); setDeleteId(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button size="sm" onClick={startCreate}>
          <Plus className="w-3.5 h-3.5" />
          Admin hinzufügen
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 ring-1 ring-black/[0.03]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900 tracking-tight">{editingId ? 'Admin bearbeiten' : 'Neuer Admin'}</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-300 hover:text-gray-500 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input id="name" label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <Input id="email" label="E-Mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <Input
              id="password"
              label={editingId ? 'Neues Passwort (leer lassen = unverändert)' : 'Passwort'}
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={editingId ? '••••••••' : 'Mindestens 8 Zeichen'}
              minLength={editingId ? undefined : 8}
              required={!editingId}
            />
            <div className="flex gap-2 pt-1">
              <Button type="submit" disabled={loading}>{loading ? 'Speichern...' : editingId ? 'Speichern' : 'Admin erstellen'}</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Abbrechen</Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden ring-1 ring-black/[0.03]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/60">Name</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/60">E-Mail</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/60">Rolle</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/60">Erstellt</th>
              <th className="px-5 py-3 bg-gray-50/60" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((user) => {
              const isSelf = user.id === currentUserId
              return (
                <tr key={user.id} className="hover:bg-blue-50/20 transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{user.name ?? '—'}</span>
                      {isSelf && <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full font-medium">Du</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 font-mono text-xs">{user.email}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                      <ShieldCheck className="w-3 h-3" />
                      Admin
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs">{formatDate(user.createdAt)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      {deleteId === user.id ? (
                        <>
                          <span className="text-xs text-red-500 mr-1">Löschen?</span>
                          <button onClick={() => handleDelete(user.id)} className="p-1 text-red-500 hover:text-red-700"><Check className="w-4 h-4" /></button>
                          <button onClick={() => setDeleteId(null)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(user)} className="p-1.5 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Pencil className="w-3.5 h-3.5" /></button>
                          {!isSelf && (
                            <button onClick={() => setDeleteId(user.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
