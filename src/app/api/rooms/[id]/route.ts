import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const { id } = await params
  const room = await prisma.room.findUnique({
    where: { id },
    include: { bookings: { include: { user: { select: { name: true, email: true } } } } },
  })
  if (!room) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(room)
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const room = await prisma.room.update({
    where: { id },
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
  return NextResponse.json(room)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id } = await params
  await prisma.room.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
