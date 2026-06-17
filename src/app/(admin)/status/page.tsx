import { prisma } from '@/lib/prisma'
import { graphClient } from '@/lib/graph'
import { CheckCircle, XCircle, AlertCircle, TriangleAlert } from 'lucide-react'
import { formatDatetime } from '@/lib/utils'
import { SubscribeButton } from './SubscribeButton'

export const dynamic = 'force-dynamic'

async function checkDatabase(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const t = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    return { ok: true, latencyMs: Date.now() - t }
  } catch (e) {
    return { ok: false, latencyMs: Date.now() - t, error: String(e) }
  }
}

async function checkGraphApi(): Promise<{ ok: boolean; latencyMs: number; tenantId?: string; error?: string }> {
  const t = Date.now()
  try {
    const org = await graphClient.api('/organization').select('id,displayName').top(1).get()
    return { ok: true, latencyMs: Date.now() - t, tenantId: org.value?.[0]?.displayName }
  } catch (e) {
    return { ok: false, latencyMs: Date.now() - t, error: String(e) }
  }
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
      {ok ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
      {label}
    </span>
  )
}

export default async function StatusPage() {
  const [db, graph, rooms] = await Promise.all([
    checkDatabase(),
    checkGraphApi(),
    prisma.room.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, color: true, msEmail: true, graphSubscriptionId: true, subscriptionExpiry: true, updatedAt: true },
    }),
  ])

  const now = new Date()
  const twoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000)
  const twentyFourHours = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  const expiredRooms = rooms.filter((r) => r.msEmail && r.subscriptionExpiry && new Date(r.subscriptionExpiry) < now)
  const expiringSoonRooms = rooms.filter((r) => r.msEmail && r.subscriptionExpiry && new Date(r.subscriptionExpiry) >= now && new Date(r.subscriptionExpiry) < twentyFourHours)
  const noSubRooms = rooms.filter((r) => r.msEmail && !r.graphSubscriptionId)

  const graphConfigured = !!(process.env.AZURE_TENANT_ID && process.env.AZURE_CLIENT_ID && process.env.AZURE_CLIENT_SECRET &&
    process.env.AZURE_TENANT_ID !== 'your-tenant-id')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Systemstatus</h1>
        <p className="text-sm text-gray-500 mt-1">Letzte Prüfung: {formatDatetime(now)}</p>
      </div>

      {/* Alert banners */}
      {expiredRooms.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800 text-sm">Webhook abgelaufen</p>
            <p className="text-sm text-red-700 mt-0.5">
              {expiredRooms.map((r) => r.name).join(', ')} — keine Echtzeit-Updates mehr. Bitte &quot;Webhooks erneuern&quot; klicken.
            </p>
          </div>
        </div>
      )}
      {expiringSoonRooms.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-start gap-3">
          <TriangleAlert className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800 text-sm">Webhook läuft bald ab</p>
            <p className="text-sm text-amber-700 mt-0.5">
              {expiringSoonRooms.map((r) => r.name).join(', ')} — Ablauf innerhalb von 24 Stunden.
            </p>
          </div>
        </div>
      )}
      {noSubRooms.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-gray-700 text-sm">Webhooks nicht eingerichtet</p>
            <p className="text-sm text-gray-600 mt-0.5">
              {noSubRooms.map((r) => r.name).join(', ')} — Exchange verknüpft, aber kein aktiver Webhook.
            </p>
          </div>
        </div>
      )}

      {/* System connections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Database */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 text-sm">PostgreSQL Datenbank</h2>
            <StatusBadge ok={db.ok} label={db.ok ? 'Verbunden' : 'Fehler'} />
          </div>
          <div className="space-y-1 text-sm text-gray-500">
            <div className="flex justify-between">
              <span>Latenz</span>
              <span className="font-mono text-gray-700">{db.latencyMs} ms</span>
            </div>
            <div className="flex justify-between">
              <span>Host</span>
              <span className="font-mono text-gray-700">localhost:5432</span>
            </div>
            <div className="flex justify-between">
              <span>Datenbank</span>
              <span className="font-mono text-gray-700">room_booking</span>
            </div>
            {db.error && <p className="text-xs text-red-600 mt-2 font-mono break-all">{db.error}</p>}
          </div>
        </div>

        {/* Microsoft Graph */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 text-sm">Microsoft Graph API</h2>
            {!graphConfigured
              ? <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500"><AlertCircle className="w-3.5 h-3.5" />Nicht konfiguriert</span>
              : <StatusBadge ok={graph.ok} label={graph.ok ? 'Verbunden' : 'Fehler'} />}
          </div>
          <div className="space-y-1 text-sm text-gray-500">
            {graphConfigured ? (
              <>
                <div className="flex justify-between">
                  <span>Latenz</span>
                  <span className="font-mono text-gray-700">{graph.latencyMs} ms</span>
                </div>
                {graph.tenantId && (
                  <div className="flex justify-between">
                    <span>Tenant</span>
                    <span className="font-mono text-gray-700 truncate max-w-[180px]">{graph.tenantId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Client ID</span>
                  <span className="font-mono text-gray-700">{process.env.AZURE_CLIENT_ID?.slice(0, 8)}…</span>
                </div>
                {graph.error && <p className="text-xs text-red-600 mt-2 font-mono break-all">{graph.error}</p>}
              </>
            ) : (
              <p className="text-xs text-amber-600">
                Azure-Credentials fehlen in <code className="bg-gray-100 px-1 rounded">.env.local</code>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Webhook Subscriptions */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900 text-sm">Graph Webhook Subscriptions</h2>
            <p className="text-xs text-gray-500 mt-0.5">Echtzeit-Benachrichtigungen bei Kalenderänderungen</p>
          </div>
          <SubscribeButton />
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wide">Raum</th>
              <th className="text-left px-5 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wide">Exchange Konto</th>
              <th className="text-left px-5 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wide">Status</th>
              <th className="text-left px-5 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wide">Läuft ab</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => {
              const expiry = room.subscriptionExpiry ? new Date(room.subscriptionExpiry) : null
              const isActive = expiry && expiry > now
              const expiresSoon = expiry && expiry > now && expiry < twoHours

              return (
                <tr key={room.id} className="border-b border-gray-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: room.color }} />
                      <span className="font-medium text-gray-800">{room.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {room.msEmail
                      ? <span className="font-mono text-xs text-gray-600">{room.msEmail}</span>
                      : <span className="text-xs text-gray-400">— nicht verknüpft</span>}
                  </td>
                  <td className="px-5 py-3">
                    {!room.msEmail ? (
                      <span className="text-xs text-gray-400">—</span>
                    ) : !room.graphSubscriptionId ? (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500"><AlertCircle className="w-3.5 h-3.5" />Kein Abo</span>
                    ) : isActive ? (
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${expiresSoon ? 'text-amber-600' : 'text-green-600'}`}>
                        <CheckCircle className="w-3.5 h-3.5" />
                        {expiresSoon ? 'Läuft bald ab' : 'Aktiv'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-red-600"><XCircle className="w-3.5 h-3.5" />Abgelaufen</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500 font-mono">
                    {expiry ? formatDatetime(expiry) : '—'}
                  </td>
                </tr>
              )
            })}
            {rooms.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-400 text-sm">Noch keine Räume angelegt</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Environment info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 text-sm mb-3">Umgebung</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {[
            { label: 'App URL', value: process.env.NEXT_PUBLIC_APP_URL || '—' },
            { label: 'Node ENV', value: process.env.NODE_ENV || '—' },
            { label: 'Räume gesamt', value: String(rooms.length) },
            { label: 'Exchange verknüpft', value: String(rooms.filter((r) => r.msEmail).length) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-gray-400 mb-0.5">{label}</p>
              <p className="font-mono text-xs text-gray-700 truncate">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
