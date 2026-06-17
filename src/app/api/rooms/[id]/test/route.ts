import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getRoomEventsToday } from '@/lib/graph'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id } = await params
  const room = await prisma.room.findUnique({ where: { id } })

  if (!room) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!room.msEmail) return NextResponse.json({ ok: false, error: 'Kein Exchange-Konto eingetragen' })

  const t = Date.now()
  try {
    const events = await getRoomEventsToday(room.msEmail)
    return NextResponse.json({
      ok: true,
      latencyMs: Date.now() - t,
      eventsToday: events.length,
      email: room.msEmail,
    })
  } catch (err) {
    const msg = String(err)
    return NextResponse.json({
      ok: false,
      latencyMs: Date.now() - t,
      error: msg.includes('404') ? 'Raumkonto nicht gefunden' :
             msg.includes('403') ? 'Keine Berechtigung (Graph-App-Permission fehlt)' :
             msg.includes('401') ? 'Authentifizierung fehlgeschlagen (Azure-Credentials prüfen)' :
             msg,
    })
  }
}
