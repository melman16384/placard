import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const roomId = searchParams.get('roomId')
  const date = searchParams.get('date')

  const where: Record<string, unknown> = {}
  if (roomId) where.roomId = roomId

  if (date) {
    const start = new Date(date)
    start.setHours(0, 0, 0, 0)
    const end = new Date(date)
    end.setHours(23, 59, 59, 999)
    where.startTime = { gte: start, lte: end }
  }

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      room: true,
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { startTime: 'asc' },
  })

  return NextResponse.json(bookings)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const startTime = new Date(body.startTime)
  const endTime = new Date(body.endTime)

  if (endTime <= startTime) {
    return NextResponse.json({ error: 'Endzeit muss nach Startzeit liegen' }, { status: 400 })
  }

  // Check for overlapping bookings
  const overlap = await prisma.booking.findFirst({
    where: {
      roomId: body.roomId,
      OR: [
        { startTime: { lt: endTime }, endTime: { gt: startTime } },
      ],
    },
  })

  if (overlap) {
    return NextResponse.json({ error: 'Der Raum ist in diesem Zeitraum bereits belegt' }, { status: 409 })
  }

  const booking = await prisma.booking.create({
    data: {
      title: body.title,
      description: body.description || null,
      startTime,
      endTime,
      roomId: body.roomId,
      userId: session.user.id,
    },
    include: { room: true, user: { select: { id: true, name: true, email: true } } },
  })

  return NextResponse.json(booking, { status: 201 })
}
