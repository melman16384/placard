import { prisma } from '@/lib/prisma'
import { SetupStep } from './SetupStep'
import { CopyButton } from './CopyButton'
import { CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getStatus() {
  const azureConfigured = !!(
    process.env.AZURE_TENANT_ID &&
    process.env.AZURE_CLIENT_ID &&
    process.env.AZURE_CLIENT_SECRET &&
    process.env.AZURE_TENANT_ID !== 'your-tenant-id'
  )

  const roomCount = await prisma.room.count()
  const linkedRooms = await prisma.room.count({ where: { msEmail: { not: null } } })
  const activeWebhooks = await prisma.room.count({
    where: { graphSubscriptionId: { not: null }, subscriptionExpiry: { gt: new Date() } },
  })

  return { azureConfigured, roomCount, linkedRooms, activeWebhooks }
}

function Badge({ ok, label, warn }: { ok: boolean; label: string; warn?: boolean }) {
  if (warn) return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
      <AlertCircle className="w-3.5 h-3.5" />{label}
    </span>
  )
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${ok ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
      {ok ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
      {label}
    </span>
  )
}

export default async function SetupPage() {
  const { azureConfigured, roomCount, linkedRooms, activeWebhooks } = await getStatus()
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/graph/webhook`
  const envPath = '/opt/room-booking/.env.local'

  const steps = [
    { id: 1, label: 'Azure App registrieren', done: azureConfigured },
    { id: 2, label: 'Credentials in .env.local eintragen', done: azureConfigured },
    { id: 3, label: 'Räume anlegen', done: roomCount > 0 },
    { id: 4, label: 'Exchange-Konten verknüpfen', done: linkedRooms > 0 },
    { id: 5, label: 'Webhooks aktivieren', done: activeWebhooks > 0 },
  ]

  const allDone = steps.every((s) => s.done)

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Einrichtungsanleitung</h1>
        <p className="text-sm text-gray-500 mt-1">Microsoft 365 Exchange Online → Middleware → eInk-Displays</p>
      </div>

      {/* Progress overview */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm font-semibold text-gray-700 mb-4">Fortschritt</p>
        <div className="flex flex-wrap gap-2">
          {steps.map((s) => (
            <Badge key={s.id} ok={s.done} label={`${s.id}. ${s.label}`} />
          ))}
        </div>
        {allDone && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800 font-medium flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Einrichtung abgeschlossen — das System ist betriebsbereit.
          </div>
        )}
      </div>

      {/* Step 1 */}
      <SetupStep
        number={1}
        title="Azure AD App registrieren"
        done={azureConfigured}
        description="Die App braucht Zugriff auf Microsoft Graph, um die Exchange-Raumkalender lesen und beschreiben zu können."
      >
        <ol className="space-y-4 text-sm text-gray-700">
          <li className="flex gap-3">
            <span className="font-bold text-blue-600 flex-shrink-0">1.</span>
            <span>
              Öffne das{' '}
              <a href="https://portal.azure.com" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-0.5">
                Azure Portal <ExternalLink className="w-3 h-3" />
              </a>
              {' '}und melde dich mit einem Admin-Konto an.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-blue-600 flex-shrink-0">2.</span>
            <span>Navigiere zu <code>Microsoft Entra ID → App-Registrierungen → Neue Registrierung</code></span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-blue-600 flex-shrink-0">3.</span>
            <div>
              <p>Fülle das Formular aus:</p>
              <ul className="mt-2 space-y-1 ml-4 list-disc text-gray-600">
                <li><strong>Name:</strong> z.B. <code>Raumbuchung Middleware</code></li>
                <li><strong>Kontotyp:</strong> Nur Konten in diesem Organisationsverzeichnis</li>
                <li><strong>Redirect URI:</strong> leer lassen</li>
              </ul>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-blue-600 flex-shrink-0">4.</span>
            <div>
              <p>Gehe zu <code>API-Berechtigungen → Berechtigung hinzufügen → Microsoft Graph → Anwendungsberechtigungen</code> und füge hinzu:</p>
              <div className="mt-2 space-y-1">
                {[
                  { perm: 'Calendars.Read', desc: 'Raumkalender lesen' },
                  { perm: 'Calendars.ReadWrite', desc: 'Ad-hoc Buchungen erstellen' },
                  { perm: 'Place.Read.All', desc: 'Raumliste aus Exchange lesen (optional)' },
                ].map(({ perm, desc }) => (
                  <div key={perm} className="flex items-center gap-2 bg-gray-50 rounded px-3 py-2">
                    <code className="text-blue-700 font-medium text-xs">{perm}</code>
                    <span className="text-xs text-gray-500">— {desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-blue-600 flex-shrink-0">5.</span>
            <span>Klicke auf <strong>„Administratorzustimmung erteilen"</strong> (der blaue Button). Ohne das funktioniert nichts.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-blue-600 flex-shrink-0">6.</span>
            <span>Gehe zu <code>Zertifikate &amp; Geheimnisse → Neuer geheimer Clientschlüssel</code>, erstelle einen Schlüssel und kopiere den <strong>Wert</strong> sofort (er wird nur einmal angezeigt).</span>
          </li>
        </ol>

        <div className="mt-5 bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm">
          <p className="font-medium text-blue-800 mb-2">Werte, die du danach brauchst:</p>
          <ul className="space-y-1 text-blue-700">
            <li>Übersichtsseite der App → <strong>Verzeichnis-ID (Tenant)</strong></li>
            <li>Übersichtsseite der App → <strong>Anwendungs-ID (Client)</strong></li>
            <li>Zertifikate &amp; Geheimnisse → <strong>Wert</strong> des erstellten Schlüssels</li>
          </ul>
        </div>
      </SetupStep>

      {/* Step 2 */}
      <SetupStep
        number={2}
        title="Credentials in .env.local eintragen"
        done={azureConfigured}
        description={`Öffne die Datei auf dem Server: ${envPath}`}
      >
        <div className="space-y-4 text-sm">
          <p className="text-gray-600">Bearbeite die Datei auf dem Server:</p>

          <div className="relative">
            <CopyButton text={`nano ${envPath}`} />
            <pre className="bg-gray-900 text-gray-100 rounded-lg px-4 py-3 text-xs overflow-x-auto pr-16">{`nano ${envPath}`}</pre>
          </div>

          <p className="text-gray-600">Ersetze die Platzhalter mit deinen Azure-Werten:</p>

          <div className="relative">
            <CopyButton text={`AZURE_TENANT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"\nAZURE_CLIENT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"\nAZURE_CLIENT_SECRET="dein-client-secret-wert"`} />
            <pre className="bg-gray-900 text-gray-100 rounded-lg px-4 py-3 text-xs overflow-x-auto pr-16">{`AZURE_TENANT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
AZURE_CLIENT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
AZURE_CLIENT_SECRET="dein-client-secret-wert"
GRAPH_WEBHOOK_SECRET="ein-zufälliges-passwort"`}</pre>
          </div>

          <p className="text-gray-600">App neu starten damit die Werte geladen werden:</p>

          <div className="relative">
            <CopyButton text="pm2 restart room-booking" />
            <pre className="bg-gray-900 text-gray-100 rounded-lg px-4 py-3 text-xs overflow-x-auto pr-16">{`pm2 restart room-booking`}</pre>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-800">
            <strong>Wichtig:</strong> Nach jedem Ändern der .env.local muss die App neu gestartet werden (<code>pm2 restart room-booking</code>). Den Status siehst du auf der <a href="/status" className="underline">Statusseite</a>.
          </div>
        </div>
      </SetupStep>

      {/* Step 3 */}
      <SetupStep
        number={3}
        title="Räume anlegen"
        done={roomCount > 0}
        description="Lege jeden physischen Raum im System an."
      >
        <div className="space-y-3 text-sm text-gray-700">
          <p>Gehe zu <a href="/rooms" className="text-blue-600 hover:underline font-medium">Räume</a> und klicke auf <strong>„Raum hinzufügen"</strong>.</p>
          <ul className="space-y-2 ml-4 list-disc text-gray-600">
            <li><strong>Name:</strong> Anzeigename auf dem Tablet-Display (z.B. „Konferenzraum A")</li>
            <li><strong>Kapazität:</strong> Wird auf dem Tablet angezeigt</li>
            <li><strong>Etage:</strong> Optional, erscheint unter dem Namen</li>
            <li><strong>Exchange-Konto:</strong> Noch freilassen — kommt in Schritt 4</li>
          </ul>
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-blue-800">
            Aktuell: <strong>{roomCount} Raum{roomCount !== 1 ? 'räume' : ''}</strong> angelegt
          </div>
        </div>
      </SetupStep>

      {/* Step 4 */}
      <SetupStep
        number={4}
        title="Exchange-Raumkonten verknüpfen"
        done={linkedRooms > 0}
        description="Verbinde jeden Raum mit seinem Exchange-Ressourcenpostfach."
      >
        <div className="space-y-4 text-sm text-gray-700">
          <p>In Exchange Online hat jeder Besprechungsraum eine eigene E-Mail-Adresse (Ressourcenpostfach). Diese trägst du im Raum ein.</p>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="font-medium text-gray-800 mb-2 text-xs uppercase tracking-wide">Exchange-Adresse herausfinden</p>
            <ol className="space-y-1 text-xs text-gray-600 list-decimal ml-4">
              <li>Exchange Admin Center öffnen: <code>admin.exchange.microsoft.com</code></li>
              <li>Empfänger → Ressourcen → Räume und Ausstattung</li>
              <li>E-Mail-Adresse des Raums kopieren (z.B. <code>kr-a@firma.de</code>)</li>
            </ol>
          </div>

          <p>Dann in der <a href="/rooms" className="text-blue-600 hover:underline font-medium">Raumverwaltung</a> den Raum bearbeiten und die Adresse unter <strong>„Microsoft Exchange"</strong> eintragen. Danach mit <strong>„Testen"</strong> prüfen ob die Verbindung klappt.</p>

          <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-blue-800">
            Aktuell: <strong>{linkedRooms} von {roomCount} Räume</strong> mit Exchange verknüpft
          </div>
        </div>
      </SetupStep>

      {/* Step 5 */}
      <SetupStep
        number={5}
        title="Echtzeit-Webhooks aktivieren"
        done={activeWebhooks > 0}
        description="Graph benachrichtigt das System sofort wenn sich ein Kalender ändert."
      >
        <div className="space-y-4 text-sm text-gray-700">
          <p>Die Webhook-URL für Microsoft Graph (wird automatisch verwendet):</p>

          <div className="relative">
            <CopyButton text={webhookUrl} />
            <pre className="bg-gray-900 text-gray-100 rounded-lg px-4 py-3 text-xs overflow-x-auto pr-16">{webhookUrl}</pre>
          </div>

          <p>Webhooks in der <a href="/rooms" className="text-blue-600 hover:underline font-medium">Raumverwaltung</a> über den Button <strong>„Webhooks aktivieren"</strong> starten — oder direkt auf der <a href="/status" className="text-blue-600 hover:underline font-medium">Statusseite</a> über <strong>„Webhooks erneuern"</strong>.</p>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs space-y-2">
            <p className="font-medium text-gray-700">Automatische Erneuerung einrichten (empfohlen)</p>
            <p className="text-gray-500">Graph-Webhooks laufen nach max. 3 Tagen ab. Richte einmalig einen Cron-Job ein:</p>
            <div className="relative">
              <CopyButton text={`(crontab -l 2>/dev/null; echo "0 */6 * * * curl -s ${process.env.NEXT_PUBLIC_APP_URL}/api/cron/renew-subscriptions >> /var/log/room-booking-cron.log 2>&1") | crontab -`} />
              <pre className="bg-gray-900 text-gray-100 rounded px-3 py-2 text-xs overflow-x-auto pr-12">{`(crontab -l 2>/dev/null; echo "0 */6 * * * curl -s \\
  ${process.env.NEXT_PUBLIC_APP_URL}/api/cron/renew-subscriptions \\
  >> /var/log/room-booking-cron.log 2>&1") | crontab -`}</pre>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-blue-800">
            Aktuell: <strong>{activeWebhooks} aktive Webhook-Subscription{activeWebhooks !== 1 ? 's' : ''}</strong>
          </div>
        </div>
      </SetupStep>

      {/* Step 6 — Tablets */}
      <SetupStep
        number={6}
        title="Tablet-Displays einrichten"
        done={false}
        optional
        description="Raspberry Pi + eInk-Display als Joan-Ersatz pro Raum."
      >
        <div className="space-y-3 text-sm text-gray-700">
          <p>Die vollständige Hardware-Bauanleitung mit Stückliste, Akku-Berechnung und Python-Script findest du hier:</p>
          <a
            href="/guide"
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Tablet-Bauanleitung öffnen / als PDF speichern
          </a>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs space-y-2">
            <p className="font-medium text-gray-700">Display-URL pro Raum</p>
            <p className="text-gray-500">Die Raum-ID findest du in der Raumverwaltung beim Display-Link:</p>
            <pre className="bg-gray-900 text-gray-100 rounded px-3 py-2 text-xs">{`${process.env.NEXT_PUBLIC_APP_URL}/display/[RAUM-ID]`}</pre>
            <p className="text-gray-500">Diese URL als <code>ROOM_ID</code> im systemd-Service des Raspberry Pi eintragen.</p>
          </div>
        </div>
      </SetupStep>
    </div>
  )
}
