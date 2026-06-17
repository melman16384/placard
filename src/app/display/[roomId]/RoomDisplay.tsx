'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Users, Clock, CheckCircle, XCircle, Plus, Loader2 } from 'lucide-react'

interface Room {
  id: string
  name: string
  capacity: number
  floor: string | null
  color: string
  msEmail?: string | null
}

interface Booking {
  id?: string
  title: string
  startTime: string | Date
  endTime: string | Date
  organizer?: string | null
  user?: { name: string | null } | null
}

interface DisplayData {
  room: Room
  source: 'exchange' | 'local'
  isOccupied: boolean
  currentBooking: Booking | null
  upcomingBookings: Booking[]
}

interface RoomDisplayProps {
  room: Room
  bookings: Booking[]
}

const ADHOC_DURATIONS = [30, 60, 90] // minutes

export function RoomDisplay({ room: initialRoom, bookings: initialBookings }: RoomDisplayProps) {
  const [now, setNow] = useState(new Date())
  const [data, setData] = useState<DisplayData>({
    room: initialRoom,
    source: 'local',
    isOccupied: false,
    currentBooking: null,
    upcomingBookings: initialBookings,
  })
  const [adhocLoading, setAdhocLoading] = useState(false)
  const [adhocError, setAdhocError] = useState<string | null>(null)
  const [adhocSuccess, setAdhocSuccess] = useState(false)
  const [showAdhoc, setShowAdhoc] = useState(false)

  async function fetchData() {
    try {
      const res = await fetch(`/api/display/${initialRoom.id}`, { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch { /* keep showing existing data */ }
  }

  useEffect(() => {
    fetchData()
    const dataInterval = setInterval(fetchData, 60_000) // refresh data every 60s
    const clockInterval = setInterval(() => setNow(new Date()), 30_000)
    return () => {
      clearInterval(dataInterval)
      clearInterval(clockInterval)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRoom.id])

  async function handleAdhoc(minutes: number) {
    setAdhocLoading(true)
    setAdhocError(null)

    const res = await fetch('/api/bookings/adhoc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: initialRoom.id, durationMinutes: minutes }),
    })

    const result = await res.json()
    setAdhocLoading(false)

    if (!res.ok) {
      setAdhocError(result.error || 'Fehler')
      return
    }

    setAdhocSuccess(true)
    setShowAdhoc(false)
    setTimeout(() => {
      setAdhocSuccess(false)
      fetchData()
    }, 3000)
  }

  const toDate = (d: string | Date) => (typeof d === 'string' ? new Date(d) : d)

  const { isOccupied, currentBooking, upcomingBookings } = data
  const hasExchange = !!initialRoom.msEmail

  return (
    <div
      className="min-h-screen flex flex-col select-none"
      style={{ backgroundColor: isOccupied ? '#FEF2F2' : '#F0FDF4' }}
    >
      {/* Header */}
      <div
        className="px-8 py-6 flex items-center justify-between"
        style={{ backgroundColor: initialRoom.color }}
      >
        <div>
          <h1 className="text-3xl font-bold text-white">{initialRoom.name}</h1>
          {initialRoom.floor && <p className="text-white/75 text-sm mt-0.5">{initialRoom.floor}</p>}
        </div>
        <div className="flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2">
          <Users className="w-5 h-5 text-white" />
          <span className="text-white font-semibold">{initialRoom.capacity}</span>
        </div>
      </div>

      {/* Status */}
      <div className="flex-1 flex flex-col px-8 py-6 gap-5">
        <div
          className="rounded-2xl p-6 flex items-center gap-4"
          style={{
            backgroundColor: isOccupied ? '#FEE2E2' : '#DCFCE7',
            border: `2px solid ${isOccupied ? '#FECACA' : '#BBF7D0'}`,
          }}
        >
          {isOccupied ? (
            <XCircle className="w-14 h-14 text-red-500 flex-shrink-0" />
          ) : (
            <CheckCircle className="w-14 h-14 text-green-500 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p
              className="text-3xl font-bold"
              style={{ color: isOccupied ? '#DC2626' : '#16A34A' }}
            >
              {isOccupied ? 'Belegt' : 'Verfügbar'}
            </p>
            {isOccupied && currentBooking && (
              <div className="mt-1">
                <p className="text-xl font-semibold text-gray-800 truncate">{currentBooking.title}</p>
                <p className="text-sm text-gray-500">
                  {format(toDate(currentBooking.startTime), 'HH:mm')} –{' '}
                  {format(toDate(currentBooking.endTime), 'HH:mm')}
                  {(currentBooking.organizer || currentBooking.user?.name) && (
                    <> · {currentBooking.organizer ?? currentBooking.user?.name}</>
                  )}
                </p>
              </div>
            )}
            {!isOccupied && upcomingBookings.length > 0 && (
              <p className="text-sm text-green-700 mt-1">
                Nächste Buchung um {format(toDate(upcomingBookings[0].startTime), 'HH:mm')} Uhr
              </p>
            )}
            {!isOccupied && upcomingBookings.length === 0 && (
              <p className="text-sm text-green-700 mt-1">Keine weiteren Buchungen heute</p>
            )}
          </div>
        </div>

        {/* Ad-hoc booking (only if Exchange connected and room is free) */}
        {hasExchange && !isOccupied && (
          <div>
            {adhocSuccess ? (
              <div className="bg-green-100 border border-green-300 rounded-xl px-5 py-4 text-green-800 font-medium text-center">
                ✓ Buchung erstellt
              </div>
            ) : showAdhoc ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <p className="text-sm font-medium text-gray-700 mb-3">Wie lange möchtest du buchen?</p>
                {adhocError && (
                  <p className="text-sm text-red-600 mb-3">{adhocError}</p>
                )}
                <div className="flex gap-3">
                  {ADHOC_DURATIONS.map((min) => (
                    <button
                      key={min}
                      disabled={adhocLoading}
                      onClick={() => handleAdhoc(min)}
                      className="flex-1 py-3 rounded-xl border-2 border-blue-200 bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {adhocLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : `${min} Min`}
                    </button>
                  ))}
                  <button
                    onClick={() => { setShowAdhoc(false); setAdhocError(null) }}
                    className="px-4 py-3 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAdhoc(true)}
                className="w-full py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Jetzt buchen
              </button>
            )}
          </div>
        )}

        {/* Upcoming bookings */}
        {upcomingBookings.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Heute noch
            </h2>
            <div className="space-y-2">
              {upcomingBookings.slice(0, 5).map((booking, i) => (
                <div
                  key={booking.id ?? i}
                  className="bg-white rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm"
                >
                  <div
                    className="w-1 h-10 rounded-full flex-shrink-0"
                    style={{ backgroundColor: initialRoom.color }}
                  />
                  <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{booking.title}</p>
                    <p className="text-sm text-gray-500">
                      {format(toDate(booking.startTime), 'HH:mm')} –{' '}
                      {format(toDate(booking.endTime), 'HH:mm')}
                    </p>
                  </div>
                  {(booking.organizer || booking.user?.name) && (
                    <span className="text-xs text-gray-400 flex-shrink-0 truncate max-w-[100px]">
                      {booking.organizer ?? booking.user?.name}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-8 py-4 border-t border-gray-200 flex items-center justify-between">
        <p className="text-sm text-gray-400">
          {format(now, 'EEEE, dd. MMMM yyyy', { locale: de })}
        </p>
        <p className="text-2xl font-mono font-semibold text-gray-700">
          {format(now, 'HH:mm')}
        </p>
      </div>
    </div>
  )
}
