# Betrieb & Wartung

## Prozessverwaltung (PM2)

```bash
# Status
pm2 status

# Logs (live)
pm2 logs placard

# Neustart (z.B. nach .env.local Änderung)
pm2 restart placard

# Neustart mit neuen Env-Variablen
pm2 restart placard --update-env

# Stoppen / Starten
pm2 stop placard
pm2 start placard

# Nach Server-Reboot automatisch starten
pm2 save
pm2 startup   # gibt einen Befehl aus — diesen ausführen
```

PM2-Konfiguration: `/opt/placard/ecosystem.config.js`

---

## Nginx

```bash
# Konfiguration testen
nginx -t

# Nginx neu laden (ohne Downtime)
systemctl reload nginx

# Status
systemctl status nginx

# Logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

Konfigurationsdatei: `/etc/nginx/sites-available/DEINE_DOMAIN.de`

---

## Datenbank-Backups

```bash
# Backup erstellen
pg_dump -U room_booking_user room_booking > /backup/room_booking_$(date +%Y%m%d).sql

# Backup einspielen
psql -U room_booking_user room_booking < /backup/room_booking_20260617.sql

# Täglicher Cron (optional)
(crontab -l 2>/dev/null; echo "0 3 * * * pg_dump -U room_booking_user room_booking > /backup/room_booking_\$(date +\%Y\%m\%d).sql") | crontab -
```

---

## Webhook-Subscriptions

Graph-Subscriptions laufen nach ~3 Tagen ab. Zwei Wege zur Erneuerung:

### Manuell (Admin-Panel)
Status-Seite → **„Webhooks erneuern"**

### Automatisch (Cron)
```bash
# Alle 6 Stunden erneuern
crontab -e
0 */6 * * * curl -s https://DEINE_DOMAIN.de/api/cron/renew-subscriptions >> /var/log/placard-cron.log 2>&1
```

### Status prüfen
Status-Seite (`/status`) zeigt pro Raum:
- Grün: Webhook aktiv
- Gelb: Läuft in < 24h ab
- Rot: Abgelaufen
- Grau: Nicht eingerichtet

---

## Deployment / Updates

```bash
cd /opt/placard

# Code aktualisieren (falls Git genutzt)
git pull

# Abhängigkeiten aktualisieren
npm install

# Datenbank-Migrationen anwenden
npx prisma migrate deploy

# Neu bauen und starten
npm run build
pm2 restart placard
```

---

## Wichtige Dateipfade

| Datei/Verzeichnis | Beschreibung |
|---|---|
| `/opt/placard/.env.local` | Alle Umgebungsvariablen (Secrets) |
| `/opt/placard/prisma/schema.prisma` | Datenbankschema |
| `/opt/placard/prisma/migrations/` | Migrationshistorie |
| `/opt/placard/ecosystem.config.js` | PM2-Konfiguration |
| `/etc/nginx/sites-available/DEINE_DOMAIN.de` | Nginx vHost |
| `/etc/ssl/placard/` | SSL-Zertifikat (selbstsigniert für Origin) |

---

## Fehlersuche

### App startet nicht

```bash
pm2 logs placard --lines 50
# Häufige Ursachen:
# - .env.local fehlt oder Werte fehlen
# - Datenbankverbindung schlägt fehl
# - Port 3002 bereits belegt
```

### Datenbankverbindung schlägt fehl

```bash
psql -U room_booking_user -d room_booking -c "SELECT 1"
# Falls Fehler: PostgreSQL läuft? Benutzer/Passwort korrekt?
systemctl status postgresql
```

### Graph API antwortet nicht

```bash
# Verbindung zur Status-Seite prüfen: /status
# Zeigt DB-Latenz und Graph-API-Status
# Falls Graph-Fehler: Azure-Credentials in .env.local prüfen
```

### Webhook-Notifications kommen nicht an

1. Ist `NEXT_PUBLIC_APP_URL` korrekt gesetzt (öffentlich erreichbar)?
2. Kann Microsoft Graph die URL erreichen? (kein Firewall-Block)
3. Stimmt `GRAPH_WEBHOOK_SECRET` in .env.local mit dem beim Erstellen der Subscription?
4. Subscription abgelaufen? → Status-Seite prüfen

### Nginx 502 Bad Gateway

```bash
# Läuft die App?
pm2 status placard
# Läuft sie auf Port 3002?
ss -tlnp | grep 3002
```

---

## Monitoring

Die **Status-Seite** (`/status`) im Admin-Panel zeigt:
- PostgreSQL-Verbindung und Latenz
- Microsoft Graph API-Verbindung
- Webhook-Status pro Raum (aktiv / läuft ab / abgelaufen / nicht eingerichtet)
- Warnbanner bei Problemen
