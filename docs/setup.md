# Einrichtung

## Voraussetzungen

- Ubuntu/Debian-Server mit öffentlicher IP
- PostgreSQL 16
- Node.js 20+ und npm
- PM2 (`npm install -g pm2`)
- Nginx
- Domain mit Cloudflare DNS (oder direkter SSL)

## 1. Repository & Abhängigkeiten

```bash
cd /opt/placard
npm install
```

## 2. Datenbank einrichten

```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE room_booking;
CREATE USER room_booking_user WITH PASSWORD 'sicheres-passwort';
GRANT ALL PRIVILEGES ON DATABASE room_booking TO room_booking_user;
ALTER USER room_booking_user CREATEDB;  -- für prisma migrate dev
\q
```

## 3. Umgebungsvariablen

Datei: `/opt/placard/.env.local`

```env
# Datenbank
DATABASE_URL="postgresql://room_booking_user:PASSWORT@localhost:5432/room_booking"

# NextAuth
NEXTAUTH_SECRET="zufälliger-base64-string"        # openssl rand -base64 32
NEXTAUTH_URL="https://DEINE_DOMAIN.de"
NEXT_PUBLIC_APP_URL="https://DEINE_DOMAIN.de"

# Port
PORT=3002

# Microsoft Graph API (Azure AD App Registration)
AZURE_TENANT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
AZURE_CLIENT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
AZURE_CLIENT_SECRET="dein-client-secret-wert"

# Webhook-Sicherheit
GRAPH_WEBHOOK_SECRET="zufälliges-passwort"

# Cron-Job-Schutz (optional)
CRON_SECRET="weiteres-zufälliges-passwort"
```

Nach jeder Änderung: `pm2 restart placard`

## 4. Azure AD App registrieren

1. **Azure Portal** → Microsoft Entra ID → App-Registrierungen → Neue Registrierung
2. Name: z.B. `Placard Middleware`, Kontotyp: Nur diese Organisation
3. **API-Berechtigungen** → Microsoft Graph → Anwendungsberechtigungen:
   - `Calendars.ReadWrite`
   - `Calendars.Read`
   - `Place.Read.All` (optional)
4. **Administratorzustimmung erteilen** (blauer Button)
5. **Zertifikate & Geheimnisse** → Neuer Schlüssel → Wert sofort kopieren
6. Übersichtsseite: Verzeichnis-ID (Tenant) und Anwendungs-ID (Client) notieren

## 5. Datenbankschema anlegen

```bash
cd /opt/placard
npx prisma migrate deploy   # Produktion
# oder:
npx prisma migrate dev      # Entwicklung (erstellt Migration)
```

## 6. Anwendung bauen

```bash
npm run build
```

## 7. PM2 starten

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # Autostart nach Reboot einrichten (Befehl ausführen der ausgegeben wird)
```

## 8. Nginx konfigurieren

Datei: `/etc/nginx/sites-available/DEINE_DOMAIN.de`

```nginx
server {
    listen 443 ssl;
    server_name DEINE_DOMAIN.de;

    ssl_certificate     /etc/ssl/placard/cert.pem;
    ssl_certificate_key /etc/ssl/placard/key.pem;

    location / {
        proxy_pass         http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/DEINE_DOMAIN.de /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

**SSL:** Cloudflare handelt das Client-SSL. Nginx nutzt ein selbstsigniertes Zertifikat für die Origin-Verbindung — das ist mit Cloudflare als Proxy korrekt.

```bash
mkdir -p /etc/ssl/placard
openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout /etc/ssl/placard/key.pem \
  -out    /etc/ssl/placard/cert.pem \
  -subj   "/CN=DEINE_DOMAIN.de"
```

## 9. Ersten Admin anlegen

Die Registrierungsseite existiert nicht mehr. Erster Admin über die Kommandozeile:

```bash
cd /opt/placard
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const p = new PrismaClient();
p.user.create({
  data: {
    name: 'Admin',
    email: 'admin@firma.de',
    password: bcrypt.hashSync('sicheres-passwort', 12),
    role: 'ADMIN'
  }
}).then(u => { console.log('Erstellt:', u.email); p.\$disconnect(); });
"
```

Danach weitere Admins über das Admin-Panel unter `/users`.

## 10. Webhooks & Cron aktivieren

```bash
# Einmalig Webhooks aktivieren (im Admin-Panel: Räume → Webhooks aktivieren)
# oder per curl:
curl -X POST https://DEINE_DOMAIN.de/api/graph/subscribe \
  -H "Cookie: next-auth.session-token=..."

# Cron für automatische Erneuerung (alle 6 Stunden)
(crontab -l 2>/dev/null; echo "0 */6 * * * curl -s https://DEINE_DOMAIN.de/api/cron/renew-subscriptions") | crontab -
```
