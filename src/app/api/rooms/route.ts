import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const rooms = await prisma.room.findMany({
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(rooms)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const body = await req.json()
  const room = await prisma.room.create({
    data: {
      name: body.name,
      capacity: body.capacity,
      floor: body.floor || null,
      amenities: body.amenities || [],
      description: body.description || null,
      color: body.color || '#3B82F6',
      msEmail: body.msEmail || null,
    },
  })
  return NextResponse.json(room, { status: 201 })
}
