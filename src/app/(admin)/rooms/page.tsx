import { prisma } from '@/lib/prisma'
import { RoomAdminPanel } from './RoomAdminPanel'

export const dynamic = 'force-dynamic'

export default async function RoomsPage() {
  const rooms = await prisma.room.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { bookings: true } } },
  })

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Raumverwaltung</h1>
        <p className="text-sm text-gray-400 mt-1">Räume anlegen, Exchange-Konten verknüpfen und Displays verwalten</p>
      </div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <RoomAdminPanel rooms={rooms as any} />
    </div>
  )
}
