import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { RoomDisplay } from './RoomDisplay'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DisplayPage({
  params,
}: {
  params: Promise<{ roomId: string }>
}) {
  const { roomId } = await params

  const room = await prisma.room.findUnique({ where: { id: roomId } })
  if (!room) notFound()

  const now = new Date()
  const endOfDay = new Date()
  endOfDay.setHours(23, 59, 59, 999)

  const bookings = await prisma.booking.findMany({
    where: {
      roomId,
      endTime: { gte: now },
      startTime: { lte: endOfDay },
    },
    include: { user: { select: { name: true } } },
    orderBy: { startTime: 'asc' },
  })

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <RoomDisplay room={room as any} bookings={bookings as any} />
  )
}
