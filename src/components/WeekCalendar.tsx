'use client'

import { useState } from 'react'
import { addDays, format, startOfWeek, isSameDay, isToday } from 'date-fns'
import { de } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7) // 7:00 - 20:00

interface Room {
  id: string
  name: string
  color: string
}

interface Booking {
  id: string
  roomId: string
  title: string
  startTime: string | Date
  endTime: string | Date
  room?: Room | null
}

interface WeekCalendarProps {
  rooms: Room[]
  bookings: Booking[]
}

function toDate(d: string | Date): Date {
  return typeof d === 'string' ? new Date(d) : d
}

export function WeekCalendar({ rooms, bookings }: WeekCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const [selectedRoom, setSelectedRoom] = useState<string>('all')

  const days = Array.from({ length: 5 }, (_, i) => addDays(currentWeek, i))

  const filteredBookings = selectedRoom === 'all'
    ? bookings
    : bookings.filter((b) => b.roomId === selectedRoom)

  function getBookingsForDay(day: Date) {
    return filteredBookings.filter((b) => isSameDay(toDate(b.startTime), day))
  }

  function getBookingStyle(booking: Booking) {
    const start = toDate(booking.startTime)
    const end = toDate(booking.endTime)
    const startMinutes = (start.getHours() - 7) * 60 + start.getMinutes()
    const durationMinutes = (end.getTime() - start.getTime()) / 60000
    const top = (startMinutes / 60) * 56
    const height = Math.max((durationMinutes / 60) * 56, 24)
    const room = rooms.find((r) => r.id === booking.roomId)
    return { top, height, color: room?.color || '#3B82F6' }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentWeek(addDays(currentWeek, -7))}
            className="p-1.5 rounded-lg hover:bg-gray-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold text-gray-900">
            {format(currentWeek, 'MMMM yyyy', { locale: de })}
          </span>
          <button
            onClick={() => setCurrentWeek(addDays(currentWeek, 7))}
            className="p-1.5 rounded-lg hover:bg-gray-100"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            className="ml-2 px-3 py-1 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
          >
            Heute
          </button>
        </div>

        <select
          value={selectedRoom}
          onChange={(e) => setSelectedRoom(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700 bg-white"
        >
          <option value="all">Alle Räume</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>

      {/* Room legend */}
      {selectedRoom === 'all' && (
        <div className="flex flex-wrap gap-3 mb-3">
          {rooms.map((r) => (
            <div key={r.id} className="flex items-center gap-1.5 text-xs text-gray-600">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: r.color }}
              />
              {r.name}
            </div>
          ))}
        </div>
      )}

      {/* Calendar grid */}
      <div className="flex-1 overflow-auto">
        <div className="flex">
          {/* Time column */}
          <div className="w-14 flex-shrink-0">
            <div className="h-10" />
            {HOURS.map((h) => (
              <div key={h} className="h-14 flex items-start justify-end pr-2 pt-0.5">
                <span className="text-xs text-gray-400">{h}:00</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const dayBookings = getBookingsForDay(day)
            return (
              <div key={day.toISOString()} className="flex-1 min-w-0">
                {/* Day header */}
                <div
                  className={cn(
                    'h-10 flex flex-col items-center justify-center border-b border-gray-200',
                    isToday(day) && 'bg-blue-50'
                  )}
                >
                  <span className={cn('text-xs font-medium', isToday(day) ? 'text-blue-700' : 'text-gray-500')}>
                    {format(day, 'EEE', { locale: de })}
                  </span>
                  <span
                    className={cn(
                      'text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full',
                      isToday(day) ? 'bg-blue-600 text-white' : 'text-gray-900'
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                </div>

                {/* Time slots */}
                <div className="relative">
                  {HOURS.map((h) => (
                    <div key={h} className="h-14 border-b border-r border-gray-100" />
                  ))}

                  {/* Bookings */}
                  {dayBookings.map((booking) => {
                    const { top, height, color } = getBookingStyle(booking)
                    return (
                      <div
                        key={booking.id}
                        className="absolute left-0.5 right-0.5 rounded px-1 py-0.5 overflow-hidden cursor-pointer text-white text-xs"
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          backgroundColor: color,
                        }}
                        title={`${booking.title} — ${booking.room?.name}`}
                      >
                        <div className="font-medium truncate">{booking.title}</div>
                        {height > 36 && (
                          <div className="opacity-80 truncate">{booking.room?.name}</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
