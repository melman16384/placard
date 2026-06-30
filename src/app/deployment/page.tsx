import { Server } from 'lucide-react'
import { PrintButton } from './PrintButton'
import { CopyButton } from './CopyButton'
import { SslTabs } from './SslTabs'

const STEPS = [
  'Systemvoraussetzungen',
  'Systempakete installieren',
  'Node.js installieren',
  'PostgreSQL einrichten',
  'PM2 installieren',
  'Projektdateien deployen',
  'Umgebungsvariablen konfigurieren',
  'Azure AD App registrieren',
  'Datenbank initialisieren',
  'Anwendung bauen & starten',
  'Nginx konfigurieren',
  'SSL-Zertifikat einrichten',
  'Firewall konfigurieren',
  'Ersten Admin anlegen',
  'Webhooks & Cron aktivieren',
  'Deployment verifizieren',
  'Updates einspielen',
]

function Cmd({ children, copy }: { children: string; copy?: string }) {
  return (
    <div className="relative my-3">
      <CopyButton text={copy ?? children} />
      <pre className="bg-gray-900 text-gray-100 rounded-lg px-4 py-3 text-xs overflow-x-auto pr-12 leading-relaxed">
        {children}
      </pre>
    </div>
  )
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-800 my-3 leading-relaxed">
      {children}
    </div>
  )
}

function Info({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-blue-800 my-3 leading-relaxed">
      {children}
    </div>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section id={`step-${n}`} className="scroll-mt-16">
      <h2>{n}. {title}</h2>
      {children}
    </section>
  )
}

export default function DeploymentPage() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://DEINE_DOMAIN.de'

  const envLocal = `# Datenbank
DATABASE_URL="postgresql://room_booking_user:SICHERES_PASSWORT@localhost:5432/room_booking"

# NextAuth
NEXTAUTH_SECRET="$(openssl rand -base64 32 ausgabe)"
NEXTAUTH_URL="${appUrl}"
NEXT_PUBLIC_APP_URL="${appUrl}"

# Port
PORT=3002

# Microsoft Graph API
AZURE_TENANT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
AZURE_CLIENT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
AZURE_CLIENT_SECRET="dein-azure-client-secret"

# Sicherheit
GRAPH_WEBHOOK_SECRET="$(openssl rand -base64 32 ausgabe)"
CRON_SECRET="$(openssl rand -base64 32 ausgabe)"`

  const nginxConf = `server {
    listen 80;
    listen [::]:80;
    server_name DEINE_DOMAIN.de;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name DEINE_DOMAIN.de;

    # SSL — siehe Schritt 12
    ssl_certificate     /etc/letsencrypt/live/DEINE_DOMAIN.de/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/DEINE_DOMAIN.de/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;

    location / {
        proxy_pass         http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 10s;
    }
}`

  const adminCmd = `node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const p = new PrismaClient();
p.user.create({
  data: {
    name: 'Admin',
    email: 'admin@DEINE_DOMAIN.de',
    password: bcrypt.hashSync('SICHERES_PASSWORT', 12),
    role: 'ADMIN'
  }
}).then(u => {
  console.log('Admin erstellt:', u.email);
  p.$disconnect();
})"`

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <div className="no-print sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-700 font-semibold">
          <Server className="w-5 h-5 text-blue-600" />
          Raumbuchung — Server Deployment
        </div>
        <div className="flex items-center gap-3">
          <a href="/setup" className="text-sm text-blue-600 hover:underline">App-Einrichtung →</a>
          <PrintButton />
        </div>
      </div>

      {/* Two-column layout: sticky TOC + content */}
      <div className="max-w-6xl mx-auto px-6 py-10 flex gap-10">

        {/* Sticky TOC */}
        <nav className="no-print hidden lg:block w-56 flex-shrink-0">
          <div className="sticky top-20">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Schritte</p>
            <ol className="space-y-1">
              {STEPS.map((title, i) => (
                <li key={i}>
                  <a
                    href={`#step-${i + 1}`}
                    className="flex items-start gap-2 text-xs text-gray-500 hover:text-blue-600 transition-colors py-0.5"
                  >
                    <span className="flex-shrink-0 w-4 text-right text-gray-300 font-mono">{i + 1}.</span>
                    {title}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </nav>

        {/* Main content */}
        <div className="flex-1 min-w-0 max-w-3xl deploy-content">

          <h1>Ubuntu Server Deployment</h1>
          <p className="lead">
            Vollständige Anleitung für Ubuntu 22.04 / 24.04 LTS — von der frischen Installation
            bis zum laufenden Produktionsbetrieb mit PM2, Nginx und SSL.
          </p>

          <hr />

          {/* ── Step 1 ── */}
          <Step n={1} title="Systemvoraussetzungen">
            <table>
              <thead>
                <tr><th>Ressource</th><th>Minimum</th><th>Empfohlen</th></tr>
              </thead>
              <tbody>
                <tr><td>CPU</td><td>1 vCore</td><td>2 vCores</td></tr>
                <tr><td>RAM</td><td>1 GB</td><td>2 GB</td></tr>
                <tr><td>Disk</td><td>10 GB</td><td>20 GB SSD</td></tr>
                <tr><td>OS</td><td>Ubuntu 22.04 LTS</td><td>Ubuntu 24.04 LTS</td></tr>
              </tbody>
            </table>
            <p><strong>Netzwerk:</strong> Öffentliche IP, Domain mit DNS-A-Record auf den Server, Ports 80 und 443 erreichbar.</p>
            <p><strong>Externe Dienste:</strong> Microsoft 365 Tenant mit Exchange Online, Azure-Konto mit Berechtigung für App-Registrierungen.</p>
          </Step>

          <hr />

          {/* ── Step 2 ── */}
          <Step n={2} title="Systempakete installieren">
            <Cmd copy="sudo apt update && sudo apt upgrade -y && sudo apt install -y git curl build-essential nginx postgresql postgresql-contrib certbot python3-certbot-nginx ufw fail2ban">{`sudo apt update && sudo apt upgrade -y

sudo apt install -y \\
  git curl build-essential \\
  nginx \\
  postgresql postgresql-contrib \\
  certbot python3-certbot-nginx \\
  ufw fail2ban`}</Cmd>
          </Step>

          <hr />

          {/* ── Step 3 ── */}
          <Step n={3} title="Node.js installieren">
            <p>Node.js 20 LTS über den offiziellen NodeSource-Feed:</p>
            <Cmd copy="curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs">{`curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs`}</Cmd>
            <p>Version prüfen:</p>
            <Cmd>{`node --version   # v20.x.x
npm --version    # 10.x.x`}</Cmd>
          </Step>

          <hr />

          {/* ── Step 4 ── */}
          <Step n={4} title="PostgreSQL einrichten">
            <p>Datenbank, Benutzer und Rechte anlegen:</p>
            <Cmd copy="sudo -u postgres psql">{`sudo -u postgres psql`}</Cmd>
            <Cmd copy={`CREATE DATABASE room_booking;\nCREATE USER room_booking_user WITH PASSWORD 'SICHERES_PASSWORT';\nGRANT ALL PRIVILEGES ON DATABASE room_booking TO room_booking_user;\nALTER USER room_booking_user CREATEDB;\n\\c room_booking\nGRANT ALL ON SCHEMA public TO room_booking_user;\n\\q`}>{`CREATE DATABASE room_booking;
CREATE USER room_booking_user WITH PASSWORD 'SICHERES_PASSWORT';
GRANT ALL PRIVILEGES ON DATABASE room_booking TO room_booking_user;
ALTER USER room_booking_user CREATEDB;
\\c room_booking
GRANT ALL ON SCHEMA public TO room_booking_user;
\\q`}</Cmd>
            <Note>
              <strong>Sicheres Passwort wählen</strong> (mind. 20 Zeichen): <code>openssl rand -base64 24</code>
              <br />Das <code>GRANT ALL ON SCHEMA public</code> ist für PostgreSQL 15+ erforderlich.
            </Note>
            <p>Verbindung testen:</p>
            <Cmd>{`psql -U room_booking_user -d room_booking -h localhost -c "SELECT version();"`}</Cmd>
          </Step>

          <hr />

          {/* ── Step 5 ── */}
          <Step n={5} title="PM2 installieren">
            <Cmd copy="sudo npm install -g pm2">{`sudo npm install -g pm2`}</Cmd>
          </Step>

          <hr />

          {/* ── Step 6 ── */}
          <Step n={6} title="Projektdateien deployen">
            <h3>Option A — Via Git (empfohlen)</h3>
            <Cmd copy="sudo mkdir -p /opt/room-booking && sudo chown $USER:$USER /opt/room-booking && git clone https://github.com/DEIN_USERNAME/room-booking.git /opt/room-booking">{`sudo mkdir -p /opt/room-booking
sudo chown $USER:$USER /opt/room-booking
git clone https://github.com/DEIN_USERNAME/room-booking.git /opt/room-booking`}</Cmd>

            <h3>Option B — Dateien hochladen (rsync)</h3>
            <p>Von der lokalen Entwicklungsmaschine:</p>
            <Cmd>{`rsync -avz --exclude node_modules --exclude .next --exclude .env.local \\
  ./  user@SERVER_IP:/opt/room-booking/`}</Cmd>

            <h3>Abhängigkeiten installieren</h3>
            <Cmd copy="cd /opt/room-booking && npm install">{`cd /opt/room-booking
npm install`}</Cmd>
          </Step>

          <hr />

          {/* ── Step 7 ── */}
          <Step n={7} title="Umgebungsvariablen konfigurieren">
            <p>Datei <code>/opt/room-booking/.env.local</code> erstellen und alle Platzhalter ersetzen:</p>
            <Cmd copy={`nano /opt/room-booking/.env.local`}>{`nano /opt/room-booking/.env.local`}</Cmd>
            <Cmd copy={envLocal}>{envLocal}</Cmd>
            <p>Secrets generieren (je einmal ausführen):</p>
            <Cmd copy="openssl rand -base64 32">{`openssl rand -base64 32   # für NEXTAUTH_SECRET
openssl rand -base64 32   # für GRAPH_WEBHOOK_SECRET
openssl rand -base64 32   # für CRON_SECRET`}</Cmd>
            <Cmd copy="chmod 600 /opt/room-booking/.env.local">{`chmod 600 /opt/room-booking/.env.local`}</Cmd>
          </Step>

          <hr />

          {/* ── Step 8 ── */}
          <Step n={8} title="Azure AD App registrieren">
            <ol>
              <li>
                <strong>Azure Portal</strong> öffnen:{' '}
                <a href="https://portal.azure.com" target="_blank" rel="noreferrer">portal.azure.com</a>
              </li>
              <li>
                <strong>Microsoft Entra ID → App-Registrierungen → Neue Registrierung</strong>
                <ul>
                  <li>Name: z.B. <code>Raumbuchungssystem</code></li>
                  <li>Kontotyp: <em>Nur diese Organisation</em></li>
                  <li>Redirect URI: leer lassen</li>
                </ul>
              </li>
              <li>
                <strong>API-Berechtigungen → Berechtigung hinzufügen → Microsoft Graph → Anwendungsberechtigungen:</strong>
                <ul>
                  <li><code>Calendars.ReadWrite</code></li>
                  <li><code>Calendars.Read</code></li>
                  <li><code>Place.Read.All</code> (optional)</li>
                </ul>
              </li>
              <li><strong>Administratorzustimmung erteilen</strong> (blauer Button — ohne das funktioniert nichts)</li>
              <li><strong>Zertifikate & Geheimnisse → Neuer geheimer Clientschlüssel</strong> → Wert sofort kopieren</li>
              <li>
                Auf der Übersichtsseite notieren:
                <ul>
                  <li><strong>Verzeichnis-ID</strong> → <code>AZURE_TENANT_ID</code></li>
                  <li><strong>Anwendungs-ID</strong> → <code>AZURE_CLIENT_ID</code></li>
                </ul>
              </li>
            </ol>
            <Info>Alle drei Werte in <code>.env.local</code> eintragen (Schritt 7) und danach mit <code>pm2 restart room-booking</code> neu starten.</Info>
          </Step>

          <hr />

          {/* ── Step 9 ── */}
          <Step n={9} title="Datenbank initialisieren">
            <Cmd copy="cd /opt/room-booking && npx prisma migrate deploy">{`cd /opt/room-booking
npx prisma migrate deploy`}</Cmd>
            <p>Prüfen ob Tabellen angelegt wurden:</p>
            <Cmd>{`psql -U room_booking_user -d room_booking -c "\\dt"`}</Cmd>
          </Step>

          <hr />

          {/* ── Step 10 ── */}
          <Step n={10} title="Anwendung bauen & starten">
            <h3>Build</h3>
            <Cmd copy="cd /opt/room-booking && npm run build">{`cd /opt/room-booking
npm run build`}</Cmd>
            <p className="text-sm text-gray-500">Der Build dauert je nach Server 1–5 Minuten.</p>

            <h3>PM2 starten</h3>
            <Cmd copy="pm2 start /opt/room-booking/ecosystem.config.js">{`pm2 start /opt/room-booking/ecosystem.config.js
pm2 status   # → room-booking: online, 2 Instanzen`}</Cmd>

            <h3>Autostart nach Reboot</h3>
            <Cmd copy="pm2 save && pm2 startup">{`pm2 save
pm2 startup
# Den ausgegebenen Befehl kopieren und ausführen, z.B.:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu`}</Cmd>

            <h3>Direkttest (ohne Nginx)</h3>
            <Cmd>{`curl -I http://localhost:3002
# → HTTP/1.1 200 OK`}</Cmd>
          </Step>

          <hr />

          {/* ── Step 11 ── */}
          <Step n={11} title="Nginx konfigurieren">
            <Cmd copy="sudo nano /etc/nginx/sites-available/room-booking">{`sudo nano /etc/nginx/sites-available/room-booking`}</Cmd>
            <Cmd copy={nginxConf}>{nginxConf}</Cmd>
            <Note>Die SSL-Zeilen im <code>443</code>-Block werden in Schritt 12 je nach gewählter Variante angepasst.</Note>
            <Cmd copy="sudo ln -s /etc/nginx/sites-available/room-booking /etc/nginx/sites-enabled/ && sudo nginx -t && sudo systemctl reload nginx">{`sudo ln -s /etc/nginx/sites-available/room-booking /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx`}</Cmd>
          </Step>

          <hr />

          {/* ── Step 12 ── */}
          <Step n={12} title="SSL-Zertifikat einrichten">
            <p>Variante wählen:</p>
            <SslTabs />
          </Step>

          <hr />

          {/* ── Step 13 ── */}
          <Step n={13} title="Firewall konfigurieren">
            <Cmd copy="sudo ufw default deny incoming && sudo ufw default allow outgoing && sudo ufw allow ssh && sudo ufw allow 'Nginx Full' && sudo ufw enable && sudo ufw status">{`sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'   # Port 80 + 443
sudo ufw enable
sudo ufw status`}</Cmd>
            <Info>Port 3002 bleibt geschlossen — nur Nginx hat Zugriff auf die App.</Info>
          </Step>

          <hr />

          {/* ── Step 14 ── */}
          <Step n={14} title="Ersten Admin anlegen">
            <p>Da keine öffentliche Registrierungsseite existiert, wird der erste Admin per CLI erstellt:</p>
            <Cmd copy={adminCmd}>{adminCmd}</Cmd>
            <p>Danach Login unter <code>/login</code> mit der eingetragenen E-Mail und dem Passwort. Weitere Admins über das Admin-Panel unter <code>/users</code>.</p>
          </Step>

          <hr />

          {/* ── Step 15 ── */}
          <Step n={15} title="Webhooks & Cron aktivieren">
            <p>Microsoft Graph benachrichtigt die App per Webhook über Kalenderänderungen. Subscriptions laufen nach ca. 3 Tagen ab.</p>

            <h3>Webhooks aktivieren</h3>
            <p>Im Admin-Panel: <strong>Räume → Webhooks aktivieren</strong> — oder über die <a href="/status">Statusseite</a>.</p>

            <h3>Automatische Erneuerung (empfohlen)</h3>
            <Cmd copy="crontab -e">{`crontab -e`}</Cmd>
            <p>Zeile hinzufügen:</p>
            <Cmd copy={`0 */6 * * * curl -s -H "x-cron-secret: CRON_SECRET" ${appUrl}/api/cron/renew-subscriptions >> /var/log/room-booking-cron.log 2>&1`}>{`0 */6 * * * curl -s -H "x-cron-secret: CRON_SECRET" \\
  ${appUrl}/api/cron/renew-subscriptions \\
  >> /var/log/room-booking-cron.log 2>&1`}</Cmd>
            <Note><strong>CRON_SECRET</strong> durch den Wert aus <code>.env.local</code> ersetzen.</Note>
          </Step>

          <hr />

          {/* ── Step 16 ── */}
          <Step n={16} title="Deployment verifizieren">
            <Cmd>{`# 1. PM2-Status
pm2 status
# → room-booking: online, 2 Instanzen

# 2. App antwortet
curl -I http://localhost:3002
# → HTTP/1.1 200 OK

# 3. HTTPS funktioniert
curl -I https://DEINE_DOMAIN.de
# → HTTP/2 200

# 4. Datenbank erreichbar
psql -U room_booking_user -d room_booking -c "SELECT COUNT(*) FROM users;"
# → 1 (der Admin)

# 5. Nginx-Fehlerlog
sudo tail -20 /var/log/nginx/error.log

# 6. App-Log
pm2 logs room-booking --lines 20 --nostream`}</Cmd>
            <Info>
              <strong>Abschließend im Browser:</strong>
              <ul className="mt-1 space-y-0.5 list-disc ml-4">
                <li><code>/login</code> → Login mit Admin-Credentials</li>
                <li><code>/setup</code> → App-Einrichtungsassistent (Azure, Räume, Webhooks)</li>
                <li><code>/status</code> → Systemstatus, Graph-API und Webhook-Gesundheit</li>
              </ul>
            </Info>
          </Step>

          <hr />

          {/* ── Step 17 ── */}
          <Step n={17} title="Updates einspielen">
            <Cmd copy={`cd /opt/room-booking\ngit pull\nnpm install\nnpx prisma migrate deploy\nnpm run build\npm2 reload room-booking`}>{`cd /opt/room-booking

# Code holen
git pull

# Abhängigkeiten (falls package.json geändert)
npm install

# Migrationen (falls schema.prisma geändert)
npx prisma migrate deploy

# Neu bauen
npm run build

# Rolling Restart — zero downtime
pm2 reload room-booking`}</Cmd>
            <Info><code>pm2 reload</code> (nicht <code>restart</code>) nutzt den Cluster-Modus für Rolling Restarts ohne Downtime.</Info>
          </Step>

        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .deploy-content { padding: 0; }
          nav { display: none !important; }
        }

        .deploy-content h1 { font-size: 1.75rem; font-weight: 800; margin-bottom: 0.5rem; color: #111; }
        .deploy-content .lead { font-size: 1rem; color: #555; margin-bottom: 1.5rem; line-height: 1.7; }
        .deploy-content h2 { font-size: 1.15rem; font-weight: 700; margin-top: 2rem; margin-bottom: 0.75rem; color: #1d4ed8; border-bottom: 2px solid #dbeafe; padding-bottom: 0.3rem; }
        .deploy-content h3 { font-size: 0.95rem; font-weight: 600; margin-top: 1.25rem; margin-bottom: 0.4rem; color: #374151; }
        .deploy-content p { color: #374151; line-height: 1.7; margin-bottom: 0.6rem; font-size: 0.9rem; }
        .deploy-content a { color: #2563eb; text-decoration: underline; }
        .deploy-content ol { padding-left: 1.5rem; color: #374151; line-height: 1.9; margin-bottom: 0.75rem; font-size: 0.9rem; }
        .deploy-content ul { padding-left: 1.5rem; color: #374151; line-height: 1.9; margin-bottom: 0.75rem; font-size: 0.9rem; }
        .deploy-content li { margin-bottom: 0.2rem; }
        .deploy-content code { background: #f1f5f9; color: #0f172a; padding: 0.1rem 0.35rem; border-radius: 0.25rem; font-size: 0.82em; }
        .deploy-content pre code { background: none; color: inherit; padding: 0; }
        .deploy-content table { width: 100%; border-collapse: collapse; margin: 0.75rem 0 1.25rem; font-size: 0.875rem; }
        .deploy-content th { background: #eff6ff; color: #1e40af; font-weight: 600; text-align: left; padding: 0.5rem 0.75rem; border: 1px solid #bfdbfe; font-size: 0.8rem; }
        .deploy-content td { padding: 0.45rem 0.75rem; border: 1px solid #e5e7eb; color: #374151; vertical-align: top; font-size: 0.875rem; }
        .deploy-content tr:nth-child(even) td { background: #f9fafb; }
        .deploy-content hr { border: none; border-top: 1px solid #e5e7eb; margin: 2rem 0; }
      `}</style>
    </div>
  )
}
