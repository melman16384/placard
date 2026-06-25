import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getRoomEventsToday, GraphEvent } from '@/lib/graph'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params

  const room = await prisma.room.findUnique({ where: { id: roomId } })
  if (!room) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // If room has a Microsoft email, fetch from Exchange
  if (room.msEmail) {
    try {
      const events = await getRoomEventsToday(room.msEmail)
      const now = new Date()

      const toUtc = (e: GraphEvent) => ({
        id: e.id,
        title: e.subject,
        startTime: new Date(e.start.dateTime + 'Z'),
        endTime: new Date(e.end.dateTime + 'Z'),
        organizer: e.organizer?.emailAddress.name ?? null,
      })

      const mapped = events.map(toUtc)
      const current = mapped.find((e) => e.startTime <= now && e.endTime > now)
      const upcoming = mapped.filter((e) => e.startTime > now)

      return NextResponse.json({
        room,
        source: 'exchange',
        isOccupied: !!current,
        currentBooking: current ?? null,
        upcomingBookings: upcoming,
      })
    } catch (err) {
      console.error('Graph API error:', err)
      // Fall through to local DB on Graph error
    }
  }

  // Fallback: local DB bookings
  const now = new Date()
  const endOfDay = new Date()
  endOfDay.setHours(23, 59, 59, 999)

  const bookings = await prisma.booking.findMany({
    where: { roomId, endTime: { gte: now }, startTime: { lte: endOfDay } },
    include: { user: { select: { name: true } } },
    orderBy: { startTime: 'asc' },
  })

  const current = bookings.find((b) => b.startTime <= now && b.endTime > now)
  const upcoming = bookings.filter((b) => b.startTime > now)

  return NextResponse.json({
    room,
    source: 'local',
    isOccupied: !!current,
    currentBooking: current ?? null,
    upcomingBookings: upcoming,
  })
}
