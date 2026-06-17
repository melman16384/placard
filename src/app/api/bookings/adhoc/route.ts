import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createRoomEvent, getRoomEventsToday } from '@/lib/graph'

/**
 * Ad-hoc booking from the tablet display — no auth required.
 * Books the room in Exchange directly.
 * Body: { roomId, durationMinutes, displayName? }
 */
export async function POST(req: Request) {
  const body = await req.json()
  const { roomId, durationMinutes = 60, displayName = 'Ad-hoc Buchung' } = body

  if (!roomId) {
    return NextResponse.json({ error: 'roomId required' }, { status: 400 })
  }

  const room = await prisma.room.findUnique({ where: { id: roomId } })
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  if (!room.msEmail) {
    return NextResponse.json({ error: 'Room not connected to Exchange' }, { status: 400 })
  }

  const now = new Date()
  const endTime = new Date(now.getTime() + durationMinutes * 60 * 1000)

  // Check for overlapping events in Exchange
  const events = await getRoomEventsToday(room.msEmail)
  const conflict = events.find((e) => {
    const start = new Date(e.start.dateTime + (e.start.timeZone === 'UTC' ? 'Z' : ''))
    const end = new Date(e.end.dateTime + (e.end.timeZone === 'UTC' ? 'Z' : ''))
    return start < endTime && end > now
  })

  if (conflict) {
    return NextResponse.json(
      { error: `Raum belegt bis ${new Date(conflict.end.dateTime + 'Z').toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr` },
      { status: 409 }
    )
  }

  const event = await createRoomEvent(room.msEmail, displayName, now, endTime, 'Raum-Display')

  return NextResponse.json({
    success: true,
    eventId: event.id,
    startTime: now,
    endTime,
  })
}
