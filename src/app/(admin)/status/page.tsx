import { prisma } from '@/lib/prisma'
import { graphClient } from '@/lib/graph'
import { CheckCircle, XCircle, AlertCircle, TriangleAlert, Zap } from 'lucide-react'
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

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
      ok ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-green-500' : 'bg-red-400'}`} />
      {label}
    </span>
  )
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm font-mono text-gray-700">{value}</span>
    </div>
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
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Systemstatus</h1>
        <p className="text-sm text-gray-400 mt-1">Letzte Prüfung: {formatDatetime(now)}</p>
      </div>

      {/* Alerts */}
      {expiredRooms.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-2xl px-5 py-4 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-700 text-sm">Webhook abgelaufen</p>
            <p className="text-sm text-red-500 mt-0.5">
              {expiredRooms.map((r) => r.name).join(', ')} — keine Echtzeit-Updates. Bitte Webhooks erneuern.
            </p>
          </div>
        </div>
      )}
      {expiringSoonRooms.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4 flex items-start gap-3">
          <TriangleAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-700 text-sm">Webhook läuft bald ab</p>
            <p className="text-sm text-amber-500 mt-0.5">
              {expiringSoonRooms.map((r) => r.name).join(', ')} — Ablauf innerhalb von 24 Stunden.
            </p>
          </div>
        </div>
      )}
      {noSubRooms.length > 0 && (
        <div className="bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-gray-300 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-gray-600 text-sm">Webhooks nicht eingerichtet</p>
            <p className="text-sm text-gray-400 mt-0.5">
              {noSubRooms.map((r) => r.name).join(', ')} — Exchange verknüpft, aber kein Webhook.
            </p>
          </div>
        </div>
      )}

      {/* Connections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 ring-1 ring-black/[0.03]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Datenbank</p>
              <h2 className="font-semibold text-gray-900 text-sm">PostgreSQL</h2>
            </div>
            <StatusPill ok={db.ok} label={db.ok ? 'Verbunden' : 'Fehler'} />
          </div>
          <div>
            <MetricRow label="Latenz" value={`${db.latencyMs} ms`} />
            <MetricRow label="Host" value="localhost:5432" />
            {db.error && <p className="text-xs text-red-500 mt-3 font-mono break-all bg-red-50 rounded-lg p-2">{db.error}</p>}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 ring-1 ring-black/[0.03]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Microsoft</p>
              <h2 className="font-semibold text-gray-900 text-sm">Graph API</h2>
            </div>
            {!graphConfigured
              ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />Nicht konfiguriert
                </span>
              : <StatusPill ok={graph.ok} label={graph.ok ? 'Verbunden' : 'Fehler'} />}
          </div>
          <div>
            {graphConfigured ? (
              <>
                <MetricRow label="Latenz" value={`${graph.latencyMs} ms`} />
                {graph.tenantId && <MetricRow label="Tenant" value={graph.tenantId} />}
                <MetricRow label="Client ID" value={`${process.env.AZURE_CLIENT_ID?.slice(0, 8)}…`} />
                {graph.error && <p className="text-xs text-red-500 mt-3 font-mono break-all bg-red-50 rounded-lg p-2">{graph.error}</p>}
              </>
            ) : (
              <p className="text-xs text-amber-500 bg-amber-50 rounded-lg p-3">
                Azure-Credentials fehlen in <code className="font-mono">.env.local</code>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Webhooks table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden ring-1 ring-black/[0.03]">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Zap className="w-4 h-4 text-blue-500" />
              <h2 className="font-semibold text-gray-900 text-sm tracking-tight">Webhook Subscriptions</h2>
            </div>
            <p className="text-xs text-gray-400">Echtzeit-Benachrichtigungen bei Kalenderänderungen</p>
          </div>
          <SubscribeButton />
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/60">Raum</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/60">Exchange Konto</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/60">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/60">Läuft ab</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rooms.map((room) => {
              const expiry = room.subscriptionExpiry ? new Date(room.subscriptionExpiry) : null
              const isActive = expiry && expiry > now
              const expiresSoon = expiry && expiry > now && expiry < twoHours

              return (
                <tr key={room.id} className="hover:bg-blue-50/20 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: room.color }} />
                      <span className="font-medium text-gray-800">{room.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {room.msEmail
                      ? <span className="font-mono text-xs text-gray-500">{room.msEmail}</span>
                      : <span className="text-xs text-gray-300">nicht verknüpft</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    {!room.msEmail ? (
                      <span className="text-xs text-gray-300">—</span>
                    ) : !room.graphSubscriptionId ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                        <AlertCircle className="w-3.5 h-3.5" />Kein Abo
                      </span>
                    ) : isActive ? (
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                        expiresSoon ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${expiresSoon ? 'bg-amber-400' : 'bg-green-500'}`} />
                        {expiresSoon ? 'Läuft bald ab' : 'Aktiv'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-red-50 text-red-500 px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />Abgelaufen
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-400 font-mono">
                    {expiry ? formatDatetime(expiry) : '—'}
                  </td>
                </tr>
              )
            })}
            {rooms.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-gray-300 text-sm">Noch keine Räume angelegt</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Env */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 ring-1 ring-black/[0.03]">
        <h2 className="font-semibold text-gray-900 text-sm mb-4 tracking-tight">Umgebung</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'App URL', value: process.env.NEXT_PUBLIC_APP_URL || '—' },
            { label: 'Node ENV', value: process.env.NODE_ENV || '—' },
            { label: 'Räume gesamt', value: String(rooms.length) },
            { label: 'Exchange verknüpft', value: String(rooms.filter((r) => r.msEmail).length) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50/60 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-400 mb-1">{label}</p>
              <p className="font-mono text-xs text-gray-700 truncate font-medium">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
