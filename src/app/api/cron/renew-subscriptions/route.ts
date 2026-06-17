import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { renewSubscription, subscribeToRoomCalendar, deleteSubscription } from '@/lib/graph'

const WEBHOOK_URL = `${process.env.NEXT_PUBLIC_APP_URL}/api/graph/webhook`
const CRON_SECRET = process.env.CRON_SECRET

/** Called by cron every 2 hours to renew expiring Graph subscriptions */
export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const twoHoursFromNow = new Date()
  twoHoursFromNow.setHours(twoHoursFromNow.getHours() + 2)

  const rooms = await prisma.room.findMany({
    where: { msEmail: { not: null } },
  })

  const results = []

  for (const room of rooms) {
    const expiry = room.subscriptionExpiry ? new Date(room.subscriptionExpiry) : null
    const needsRenewal = !expiry || expiry < twoHoursFromNow

    if (!needsRenewal) {
      results.push({ room: room.name, status: 'ok' })
      continue
    }

    try {
      if (room.graphSubscriptionId) {
        try {
          const newExpiry = await renewSubscription(room.graphSubscriptionId)
          await prisma.room.update({
            where: { id: room.id },
            data: { subscriptionExpiry: new Date(newExpiry) },
          })
          results.push({ room: room.name, status: 'renewed' })
          continue
        } catch {
          // Subscription gone — create new one
          try { await deleteSubscription(room.graphSubscriptionId) } catch {}
        }
      }

      // Create fresh subscription
      const sub = await subscribeToRoomCalendar(room.msEmail!, WEBHOOK_URL)
      await prisma.room.update({
        where: { id: room.id },
        data: {
          graphSubscriptionId: sub.id,
          subscriptionExpiry: new Date(sub.expirationDateTime),
        },
      })
      results.push({ room: room.name, status: 'resubscribed' })
    } catch (err) {
      results.push({ room: room.name, status: 'error', error: String(err) })
    }
  }

  return NextResponse.json({ results, ran: new Date().toISOString() })
}
