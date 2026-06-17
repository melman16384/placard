import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Graph sends a validation token on first subscription — we must echo it back
export async function POST(req: Request) {
  const { searchParams } = new URL(req.url)
  const validationToken = searchParams.get('validationToken')

  if (validationToken) {
    return new Response(validationToken, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  const body = await req.json()
  const clientState = body?.value?.[0]?.clientState

  if (clientState !== process.env.GRAPH_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Invalid client state' }, { status: 401 })
  }

  // Process each notification
  const notifications = body?.value ?? []
  for (const notification of notifications) {
    const resource: string = notification.resource ?? ''
    // resource looks like: "Users/abc123/Events/event456"
    // We extract the user ID (room mailbox) to find which room changed
    const userMatch = resource.match(/Users\/([^/]+)\//i)
    if (!userMatch) continue

    const userId = userMatch[1]

    // Mark this room as needing a refresh by touching its updatedAt
    // The display API will then fetch fresh data from Graph
    await prisma.room.updateMany({
      where: {
        OR: [
          { msEmail: { equals: userId, mode: 'insensitive' } },
          // Also match if userId is the OID — would need to be resolved
          // For simplicity we rely on email match
        ],
      },
      data: { updatedAt: new Date() },
    })
  }

  return NextResponse.json({ received: true })
}

// Graph validation (GET with validationToken) — some clients send GET
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const validationToken = searchParams.get('validationToken')

  if (validationToken) {
    return new Response(validationToken, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  return NextResponse.json({ ok: true })
}
