# Deployment auf Ubuntu Server

Diese Anleitung beschreibt die vollständige Ersteinrichtung des Placards auf einem frischen Ubuntu 22.04 / 24.04 LTS Server — von der Paketverwaltung bis zum laufenden Produktionsbetrieb.

---

## Inhaltsverzeichnis

1. [Systemvoraussetzungen](#1-systemvoraussetzungen)
2. [Systempakete installieren](#2-systempakete-installieren)
3. [Node.js installieren](#3-nodejs-installieren)
4. [PostgreSQL einrichten](#4-postgresql-einrichten)
5. [PM2 installieren](#5-pm2-installieren)
6. [Projektdateien deployen](#6-projektdateien-deployen)
7. [Umgebungsvariablen konfigurieren](#7-umgebungsvariablen-konfigurieren)
8. [Azure AD App registrieren](#8-azure-ad-app-registrieren)
9. [Datenbank initialisieren](#9-datenbank-initialisieren)
10. [Anwendung bauen & starten](#10-anwendung-bauen--starten)
11. [Nginx konfigurieren](#11-nginx-konfigurieren)
12. [SSL-Zertifikat einrichten](#12-ssl-zertifikat-einrichten)
13. [Firewall konfigurieren](#13-firewall-konfigurieren)
14. [Ersten Admin-Benutzer anlegen](#14-ersten-admin-benutzer-anlegen)
15. [Webhooks & Cron aktivieren](#15-webhooks--cron-aktivieren)
16. [Deployment verifizieren](#16-deployment-verifizieren)
17. [Updates einspielen](#17-updates-einspielen)

---

## 1. Systemvoraussetzungen

**Mindestanforderungen (Produktion):**

| Ressource | Minimum | Empfohlen |
|-----------|---------|-----------|
| CPU       | 1 vCore | 2 vCores  |
| RAM       | 1 GB    | 2 GB      |
| Disk      | 10 GB   | 20 GB SSD |
| OS        | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |

**Netzwerk:**
- Öffentliche IP-Adresse
- Domain mit DNS-Eintrag auf den Server zeigend
- Ports 80 und 443 erreichbar (für SSL-Zertifikat und HTTPS)

**Externe Dienste:**
- Microsoft 365 Tenant (Exchange Online)
- Azure-Konto mit Berechtigung, App-Registrierungen zu erstellen

---

## 2. Systempakete installieren

```bash
sudo apt update && sudo apt upgrade -y

sudo apt install -y \
  git \
  curl \
  build-essential \
  nginx \
  postgresql \
  postgresql-contrib \
  certbot \
  python3-certbot-nginx \
  ufw \
  fail2ban
```

---

## 3. Node.js installieren

Node.js 20 LTS über den offiziellen NodeSource-Feed:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Version prüfen:

```bash
node --version   # v20.x.x
npm --version    # 10.x.x
```

---

## 4. PostgreSQL einrichten

### Datenbankbenutzer und Datenbank anlegen

```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE room_booking;
CREATE USER room_booking_user WITH PASSWORD 'SICHERES_PASSWORT_HIER';
GRANT ALL PRIVILEGES ON DATABASE room_booking TO room_booking_user;
-- Für Prisma Migrations (migrate dev) benötigt:
ALTER USER room_booking_user CREATEDB;
-- Schemarechte für PostgreSQL 15+:
\c room_booking
GRANT ALL ON SCHEMA public TO room_booking_user;
\q
```

> **Passwort:** Starkes Passwort wählen (mindestens 20 Zeichen, zufällig).  
> Tipp: `openssl rand -base64 24`

### Verbindung testen

```bash
psql -U room_booking_user -d room_booking -h localhost -c "SELECT version();"
# Passwort eingeben → sollte PostgreSQL-Version ausgeben
```

---

## 5. PM2 installieren

```bash
sudo npm install -g pm2
```

---

## 6. Projektdateien deployen

### Option A: Via Git (empfohlen)

```bash
sudo mkdir -p /opt/placard
sudo chown $USER:$USER /opt/placard

git clone https://github.com/DEIN_USERNAME/placard.git /opt/placard
cd /opt/placard
```

### Option B: Dateien hochladen (rsync)

Von der lokalen Entwicklungsmaschine:

```bash
rsync -avz --exclude node_modules --exclude .next --exclude .env.local \
  ./  user@SERVER_IP:/opt/placard/
```

### Abhängigkeiten installieren

```bash
cd /opt/placard
npm install
```

---

## 7. Umgebungsvariablen konfigurieren

Datei `/opt/placard/.env.local` erstellen:

```bash
nano /opt/placard/.env.local
```

Inhalt (alle Platzhalter ersetzen):

```env
# ── Datenbank ──────────────────────────────────────────────────────────
DATABASE_URL="postgresql://room_booking_user:SICHERES_PASSWORT_HIER@localhost:5432/room_booking"

# ── NextAuth ───────────────────────────────────────────────────────────
NEXTAUTH_SECRET="ZUFAELLIGER_BASE64_STRING"        # openssl rand -base64 32
NEXTAUTH_URL="https://DEINE_DOMAIN.de"
NEXT_PUBLIC_APP_URL="https://DEINE_DOMAIN.de"

# ── Port ───────────────────────────────────────────────────────────────
PORT=3002

# ── Microsoft Graph API (Azure AD) ────────────────────────────────────
AZURE_TENANT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
AZURE_CLIENT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
AZURE_CLIENT_SECRET="dein-azure-client-secret"

# ── Sicherheit ─────────────────────────────────────────────────────────
GRAPH_WEBHOOK_SECRET="ZUFAELLIGES_WEBHOOK_PASSWORT"   # openssl rand -base64 32
CRON_SECRET="ZUFAELLIGES_CRON_PASSWORT"               # openssl rand -base64 32
```

Secrets generieren:

```bash
# Je einen Befehl pro Secret ausführen:
openssl rand -base64 32   # für NEXTAUTH_SECRET
openssl rand -base64 32   # für GRAPH_WEBHOOK_SECRET
openssl rand -base64 32   # für CRON_SECRET
```

Dateiberechtigungen einschränken:

```bash
chmod 600 /opt/placard/.env.local
```

---

## 8. Azure AD App registrieren

1. **Azure Portal** öffnen → [portal.azure.com](https://portal.azure.com)
2. **Microsoft Entra ID** → **App-Registrierungen** → **Neue Registrierung**
3. Name: `Placard`, Kontotyp: *Nur diese Organisation*
4. **API-Berechtigungen** → **Berechtigung hinzufügen** → **Microsoft Graph** → **Anwendungsberechtigungen:**
   - `Calendars.ReadWrite`
   - `Calendars.Read`
   - `Place.Read.All` (optional, für Raumdetails)
5. **Administratorzustimmung erteilen** (blauer Button oben)
6. **Zertifikate & Geheimnisse** → **Neuer geheimer Clientschlüssel** → Wert sofort kopieren
7. **Übersicht:** Verzeichnis-ID (= `AZURE_TENANT_ID`) und Anwendungs-ID (= `AZURE_CLIENT_ID`) notieren

Die kopierten Werte in `/opt/placard/.env.local` eintragen.

---

## 9. Datenbank initialisieren

```bash
cd /opt/placard
npx prisma migrate deploy
```

> Dieser Befehl führt alle vorhandenen Migrationen aus. Keine Daten werden verändert — nur das Schema wird erstellt.

Prüfen:

```bash
npx prisma db pull   # zeigt das erkannte Schema
# oder:
psql -U room_booking_user -d room_booking -c "\dt"
# sollte Tabellen auflisten: users, rooms, bookings, ...
```

---

## 10. Anwendung bauen & starten

### Build

```bash
cd /opt/placard
npm run build
```

> Der Build dauert je nach Server 1–5 Minuten. Das `.next/` Verzeichnis wird erzeugt.

### PM2 starten

```bash
pm2 start ecosystem.config.js
pm2 status   # sollte "placard" mit status "online" zeigen
```

### Autostart nach Reboot einrichten

```bash
pm2 save
pm2 startup
# Den ausgegebenen Befehl kopieren und ausführen, z.B.:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

### Logs prüfen

```bash
pm2 logs placard --lines 30
# Keine Fehler → Anwendung läuft korrekt
```

### Direkttest (ohne Nginx)

```bash
curl http://localhost:3002
# sollte HTML zurückgeben
```

---

## 11. Nginx konfigurieren

### Konfigurationsdatei erstellen

```bash
sudo nano /etc/nginx/sites-available/placard
```

Inhalt (Domain anpassen):

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name DEINE_DOMAIN.de;

    # Certbot-Challenge (wird von certbot automatisch befüllt)
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Alle anderen Requests auf HTTPS umleiten
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name DEINE_DOMAIN.de;

    # SSL-Zertifikate (werden von certbot eingetragen)
    ssl_certificate     /etc/letsencrypt/live/DEINE_DOMAIN.de/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/DEINE_DOMAIN.de/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    # Sicherheitsheader
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;

    # Proxy zur Next.js-App
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
}
```

### Aktivieren & testen

```bash
sudo ln -s /etc/nginx/sites-available/placard /etc/nginx/sites-enabled/
sudo nginx -t          # Konfiguration testen
sudo systemctl reload nginx
```

---

## 12. SSL-Zertifikat einrichten

### Option A: Let's Encrypt (öffentlicher Server mit echter Domain)

```bash
sudo certbot --nginx -d DEINE_DOMAIN.de
# E-Mail eingeben, AGBs akzeptieren
# Certbot ergänzt die SSL-Zeilen in der Nginx-Konfiguration automatisch
```

Automatische Erneuerung prüfen:

```bash
sudo certbot renew --dry-run
# Systemd-Timer ist bereits aktiv:
systemctl status certbot.timer
```

### Option B: Cloudflare als Proxy (Origin-Zertifikat)

Wenn der Server hinter Cloudflare läuft (DNS-Proxy aktiviert):

```bash
sudo mkdir -p /etc/ssl/placard
```

Im Cloudflare Dashboard: **SSL/TLS** → **Ursprungsserver** → **Zertifikat erstellen** → PEM-Dateien herunterladen und hochladen:

```bash
sudo nano /etc/ssl/placard/cert.pem   # Zertifikat einfügen
sudo nano /etc/ssl/placard/key.pem    # Privaten Schlüssel einfügen
sudo chmod 600 /etc/ssl/placard/key.pem
```

In der Nginx-Konfiguration die `ssl_certificate`-Zeilen anpassen:

```nginx
ssl_certificate     /etc/ssl/placard/cert.pem;
ssl_certificate_key /etc/ssl/placard/key.pem;
```

Cloudflare SSL-Modus auf **Full (strict)** setzen.

### Option C: Eigenes Zertifikat (gekauft oder von interner CA)

Wenn ein Zertifikat von einer kommerziellen CA (z.B. DigiCert, Sectigo, GÉANT/DFN) oder einer internen Unternehmens-CA vorliegt.

#### Dateien vorbereiten

Typischerweise liefert die CA folgende Dateien:

| Dateiname (variiert) | Inhalt |
|---|---|
| `deine-domain.crt` oder `cert.pem` | Dein Zertifikat |
| `deine-domain.key` | Privater Schlüssel (nur du hast ihn) |
| `ca-bundle.crt` oder `chain.pem` | Zwischenzertifikate der CA |

> Falls der private Schlüssel passwortgeschützt ist, muss er für Nginx entschlüsselt werden — siehe [Passwortschutz entfernen](#passwortschutz-vom-privaten-schlüssel-entfernen).

#### Zertifikat und Schlüssel kopieren

```bash
sudo mkdir -p /etc/ssl/placard
sudo chmod 700 /etc/ssl/placard

# Zertifikat + CA-Kette zu einer Datei zusammenführen (fullchain)
# Reihenfolge: erst dein Zertifikat, dann die Zwischenzertifikate
sudo bash -c 'cat deine-domain.crt ca-bundle.crt > /etc/ssl/placard/fullchain.pem'

# Privaten Schlüssel kopieren
sudo cp deine-domain.key /etc/ssl/placard/privkey.pem
sudo chmod 600 /etc/ssl/placard/privkey.pem
sudo chown root:root /etc/ssl/placard/privkey.pem
```

> Falls die CA nur ein einzelnes `.pem` ohne separate Kette liefert, prüfe ob mehrere `-----BEGIN CERTIFICATE-----` Blöcke enthalten sind. Wenn ja, ist die Kette bereits eingebettet und die Datei kann direkt als `fullchain.pem` verwendet werden.

#### Diffie-Hellman-Parameter generieren (einmalig, empfohlen)

```bash
sudo openssl dhparam -out /etc/ssl/placard/dhparam.pem 2048
# Dauert 1–2 Minuten
```

#### Nginx-Konfiguration anpassen

Den `server`-Block für Port 443 in `/etc/nginx/sites-available/placard` so ändern:

```nginx
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name DEINE_DOMAIN.de;

    ssl_certificate     /etc/ssl/placard/fullchain.pem;
    ssl_certificate_key /etc/ssl/placard/privkey.pem;

    # Starke SSL-Parameter
    ssl_dhparam         /etc/ssl/placard/dhparam.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    ssl_session_cache   shared:SSL:10m;
    ssl_session_timeout 1d;

    # Sicherheitsheader
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
}
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

#### Zertifikat prüfen

```bash
# Läuft TLS korrekt?
openssl s_client -connect DEINE_DOMAIN.de:443 -servername DEINE_DOMAIN.de < /dev/null 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates
# Ausgabe zeigt: Aussteller, Domain, Gültigkeitszeitraum

# Vollständige Kette vorhanden?
openssl s_client -connect DEINE_DOMAIN.de:443 -servername DEINE_DOMAIN.de < /dev/null 2>/dev/null \
  | grep -E "subject|issuer"
# Es sollten mehrere Zeilen erscheinen (Zertifikat + Zwischenzertifikat/e)
```

#### Ablauf überwachen & rechtzeitig erneuern

Gewerbliche Zertifikate laufen typischerweise nach 1 oder 2 Jahren ab. Erinnerung per Cron einrichten:

```bash
crontab -e
```

Zeile hinzufügen (prüft täglich, warnt 30 Tage vorher per E-Mail):

```cron
0 8 * * * openssl x509 -enddate -noout -in /etc/ssl/placard/fullchain.pem | grep -v "notAfter=$(date -d '+30 days' '+%b')" || echo "SSL-Zertifikat läuft in weniger als 30 Tagen ab!" | mail -s "SSL-Warnung DEINE_DOMAIN.de" admin@DEINE_DOMAIN.de
```

Oder einfacher — Ablaufdatum einmalig anzeigen und im Kalender eintragen:

```bash
openssl x509 -enddate -noout -in /etc/ssl/placard/fullchain.pem
# Ausgabe: notAfter=Jun 15 12:00:00 2027 GMT
```

#### Passwortschutz vom privaten Schlüssel entfernen

Falls der Schlüssel beim Start nach einem Passwort fragt (Nginx startet dann nicht automatisch):

```bash
# Prüfen ob Schlüssel verschlüsselt ist:
head -2 deine-domain.key
# → "Proc-Type: 4,ENCRYPTED" → verschlüsselt; andernfalls → kein Passwort

# Passwort entfernen (Originalpasswort wird einmal abgefragt):
sudo openssl rsa -in deine-domain.key -out /etc/ssl/placard/privkey.pem
sudo chmod 600 /etc/ssl/placard/privkey.pem
```

---

### Option D: Selbstsigniertes Zertifikat (intern / Testumgebung)

```bash
sudo mkdir -p /etc/ssl/placard
sudo openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout /etc/ssl/placard/privkey.pem \
  -out    /etc/ssl/placard/fullchain.pem \
  -subj   "/CN=DEINE_DOMAIN.de"
sudo chmod 600 /etc/ssl/placard/privkey.pem
```

Nginx-Konfiguration wie in Option C verwenden (ohne `ssl_dhparam` falls nicht generiert).

> Browser zeigen eine Sicherheitswarnung — für interne/private Umgebungen akzeptabel.

---

## 13. Firewall konfigurieren

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'   # Port 80 + 443
sudo ufw enable
sudo ufw status
```

Erwartete Ausgabe:

```
Status: active

To                         Action      From
--                         ------      ----
OpenSSH                    ALLOW       Anywhere
Nginx Full                 ALLOW       Anywhere
```

> Port 3002 bleibt geschlossen — nur Nginx hat Zugriff auf die App.

---

## 14. Ersten Admin-Benutzer anlegen

Da keine öffentliche Registrierungsseite existiert, wird der erste Admin über die Kommandozeile erstellt:

```bash
cd /opt/placard
node -e "
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
  p.\$disconnect();
}).catch(e => {
  console.error(e);
  p.\$disconnect();
});
"
```

Anmeldung über `https://DEINE_DOMAIN.de/login` mit der eingetragenen E-Mail und dem Passwort.

Weitere Admins können danach über das Admin-Panel unter `/users` angelegt werden.

---

## 15. Webhooks & Cron aktivieren

Microsoft Graph benachrichtigt die App per Webhook über Kalenderänderungen. Subscriptions laufen nach ca. 3 Tagen ab und müssen regelmäßig erneuert werden.

### Webhooks aktivieren

Im Admin-Panel: **Räume** → **Webhooks aktivieren**

Oder per curl (Session-Cookie aus dem Browser entnehmen):

```bash
curl -X POST https://DEINE_DOMAIN.de/api/graph/subscribe \
  -H "Cookie: authjs.session-token=SESSION_TOKEN_AUS_DEM_BROWSER"
```

### Automatische Erneuerung via Cron

```bash
crontab -e
```

Folgende Zeile hinzufügen:

```cron
0 */6 * * * curl -s -H "Authorization: Bearer CRON_SECRET_AUS_ENV" https://DEINE_DOMAIN.de/api/cron/renew-subscriptions >> /var/log/placard-cron.log 2>&1
```

> `CRON_SECRET_AUS_ENV` durch den Wert aus `.env.local` ersetzen.

### Webhook-Status prüfen

Admin-Panel → **Status** (`/status`):
- Grün: Webhook aktiv
- Gelb: Läuft in < 24h ab → wird beim nächsten Cron-Lauf erneuert
- Rot: Abgelaufen → manuell erneuern
- Grau: Nicht eingerichtet

---

## 16. Deployment verifizieren

```bash
# 1. PM2-Status
pm2 status
# → placard: online, 2 Instanzen

# 2. App antwortet
curl -I http://localhost:3002
# → HTTP/1.1 200 OK

# 3. Nginx leitet korrekt weiter
curl -I https://DEINE_DOMAIN.de
# → HTTP/2 200

# 4. Datenbank erreichbar
psql -U room_booking_user -d room_booking -c "SELECT COUNT(*) FROM users;"
# → 1 (der soeben angelegte Admin)

# 5. Nginx-Logs
sudo tail -20 /var/log/nginx/error.log
# → keine Fehler

# 6. App-Logs
pm2 logs placard --lines 20 --nostream
# → keine Fehler, "Ready in Xms" sichtbar
```

Abschließend im Browser öffnen:
- `https://DEINE_DOMAIN.de` → Startseite / Raumübersicht
- `https://DEINE_DOMAIN.de/login` → Login mit Admin-Credentials
- `https://DEINE_DOMAIN.de/status` → Systemstatus (nach Login)

---

## 17. Updates einspielen

```bash
cd /opt/placard

# 1. Neuen Code holen
git pull

# 2. Abhängigkeiten aktualisieren (falls package.json geändert)
npm install

# 3. Datenbank-Migrationen anwenden (falls schema.prisma geändert)
npx prisma migrate deploy

# 4. Neu bauen
npm run build

# 5. PM2 neu starten (zero-downtime durch Cluster-Modus)
pm2 reload placard
```

> `pm2 reload` (nicht `restart`) nutzt den Cluster-Modus für Rolling Restarts ohne Downtime.

---

## Referenz: Wichtige Pfade & Befehle

| Datei / Befehl | Beschreibung |
|---|---|
| `/opt/placard/.env.local` | Alle Secrets und Konfiguration |
| `/opt/placard/ecosystem.config.js` | PM2-Konfiguration (Port, Cluster) |
| `/etc/nginx/sites-available/placard` | Nginx vHost-Konfiguration |
| `pm2 status` | Prozessstatus |
| `pm2 logs placard` | Live-Logs |
| `pm2 reload placard` | Neustart ohne Downtime |
| `sudo nginx -t` | Nginx-Konfiguration testen |
| `sudo systemctl reload nginx` | Nginx neu laden |
| `npx prisma migrate deploy` | Datenbankschema aktualisieren |
| `npx prisma studio` | Datenbank-Browser (Entwicklung) |

Weiterführende Dokumentation: [operations.md](operations.md)
