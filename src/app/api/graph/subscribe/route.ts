import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { subscribeToRoomCalendar, renewSubscription, deleteSubscription } from '@/lib/graph'

const WEBHOOK_URL = `${process.env.NEXT_PUBLIC_APP_URL}/api/graph/webhook`

/** Subscribe all rooms with an msEmail to Graph change notifications */
export async function POST() {
  const session = await auth()
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const rooms = await prisma.room.findMany({
    where: { msEmail: { not: null } },
  })

  const results = []

  for (const room of rooms) {
    try {
      // Delete old subscription if exists
      if (room.graphSubscriptionId) {
        try {
          await deleteSubscription(room.graphSubscriptionId)
        } catch {
          // Might already be expired — ignore
        }
      }

      const sub = await subscribeToRoomCalendar(room.msEmail!, WEBHOOK_URL)

      await prisma.room.update({
        where: { id: room.id },
        data: {
          graphSubscriptionId: sub.id,
          subscriptionExpiry: new Date(sub.expirationDateTime),
        },
      })

      results.push({ room: room.name, status: 'subscribed', expiry: sub.expirationDateTime })
    } catch (err) {
      results.push({ room: room.name, status: 'error', error: String(err) })
    }
  }

  return NextResponse.json({ results })
}

/** Renew subscriptions that expire within 2 hours */
export async function PUT() {
  const session = await auth()
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const twoHoursFromNow = new Date()
  twoHoursFromNow.setHours(twoHoursFromNow.getHours() + 2)

  const rooms = await prisma.room.findMany({
    where: {
      graphSubscriptionId: { not: null },
      subscriptionExpiry: { lte: twoHoursFromNow },
    },
  })

  const results = []

  for (const room of rooms) {
    try {
      const newExpiry = await renewSubscription(room.graphSubscriptionId!)
      await prisma.room.update({
        where: { id: room.id },
        data: { subscriptionExpiry: new Date(newExpiry) },
      })
      results.push({ room: room.name, status: 'renewed', expiry: newExpiry })
    } catch (err) {
      results.push({ room: room.name, status: 'error', error: String(err) })
    }
  }

  return NextResponse.json({ results })
}
