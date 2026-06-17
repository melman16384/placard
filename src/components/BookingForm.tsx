'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Room } from '@/types'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select } from './ui/select'

interface BookingFormProps {
  rooms: Room[]
  preselectedRoomId?: string
  preselectedDate?: string
}

export function BookingForm({ rooms, preselectedRoomId, preselectedDate }: BookingFormProps) {
  const router = useRouter()
  const today = preselectedDate || format(new Date(), 'yyyy-MM-dd')

  const [form, setForm] = useState({
    roomId: preselectedRoomId || (rooms[0]?.id ?? ''),
    title: '',
    description: '',
    date: today,
    startTime: '09:00',
    endTime: '10:00',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const startTime = new Date(`${form.date}T${form.startTime}:00`)
    const endTime = new Date(`${form.date}T${form.endTime}:00`)

    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: form.roomId,
        title: form.title,
        description: form.description,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Fehler beim Erstellen der Buchung')
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        id="room"
        label="Raum"
        value={form.roomId}
        onChange={(e) => setForm({ ...form, roomId: e.target.value })}
        required
      >
        {rooms.map((room) => (
          <option key={room.id} value={room.id}>
            {room.name} ({room.capacity} Personen)
          </option>
        ))}
      </Select>

      <Input
        id="title"
        label="Titel / Zweck"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        placeholder="z.B. Team-Meeting, Präsentation..."
        required
      />

      <Input
        id="description"
        label="Beschreibung (optional)"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="Weitere Details..."
      />

      <Input
        id="date"
        label="Datum"
        type="date"
        value={form.date}
        onChange={(e) => setForm({ ...form, date: e.target.value })}
        required
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          id="startTime"
          label="Von"
          type="time"
          value={form.startTime}
          onChange={(e) => setForm({ ...form, startTime: e.target.value })}
          required
        />
        <Input
          id="endTime"
          label="Bis"
          type="time"
          value={form.endTime}
          onChange={(e) => setForm({ ...form, endTime: e.target.value })}
          required
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Buchen...' : 'Raum buchen'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
        >
          Abbrechen
        </Button>
      </div>
    </form>
  )
}
