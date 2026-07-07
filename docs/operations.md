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

> Der Prozess läuft **nicht mehr als root**, sondern als dedizierter, unprivilegierter Systembenutzer `svc-placard` (Fork-Modus, 1 Instanz statt zuvor Cluster-Modus mit 2 Instanzen). Details und Hintergrund dazu: [deployment-ubuntu.md, Abschnitt 13](deployment-ubuntu.md#13-firewall-und-systemhärtung).

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

Konfigurationsdatei: `/etc/nginx/sites-available/placard.luwilab.work`

---

## Sicherheit

Der Server wurde einer Hardening-Maßnahme unterzogen. Kurzüberblick (vollständige Details und Begründungen: [deployment-ubuntu.md, Abschnitt 13](deployment-ubuntu.md#13-firewall-und-systemhärtung)):

- **Firewall (UFW):** aktiv, `default deny incoming` — von außen sind nur SSH (22), HTTP (80) und HTTPS (443) erreichbar. Port 3002 (Placard) ist nicht mehr direkt aus dem Internet erreichbar, sondern nur über den Nginx-Reverse-Proxy.
- **fail2ban:** serverweit aktiv mit einer `sshd`-Jail — schützt SSH gegen Brute-Force-Versuche (nicht Placard-spezifisch).
- **Nginx-Härtung:** `ssl_protocols` global auf TLSv1.2/TLSv1.3 beschränkt, `server_tokens off`, Rate-Limiting (`login_limit`, 5 Req./Min. pro IP) auf `/api/auth/`, sowie `location ~ /\.git { deny all; }` als Defense-in-Depth.
- **Nicht-root-Prozess:** PM2 führt Placard als `svc-placard` aus (siehe PM2-Abschnitt oben).
- **Dateiberechtigungen:** `.env` und `.env.local` sind `chmod 600` und gehören `svc-placard` (vorher versehentlich 644/world-readable).
- **SSH:** X11Forwarding ist serverweit deaktiviert.

`NEXTAUTH_SECRET` wurde dabei **nicht** rotiert — nur die Dateiberechtigungen der `.env`-Dateien wurden korrigiert.

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
0 */6 * * * curl -s -H "Authorization: Bearer CRON_SECRET_AUS_ENV" https://placard.luwilab.work/api/cron/renew-subscriptions >> /var/log/placard-cron.log 2>&1
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
| `/etc/nginx/sites-available/placard.luwilab.work` | Nginx vHost |
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
# - Rechteproblem: Dateien/Verzeichnisse gehören nicht svc-placard
#   (Prozess läuft als svc-placard, nicht mehr als root)
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
