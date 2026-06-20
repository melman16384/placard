# Raumbuchungssystem

Joan-Tablet-Ersatz auf Basis von Raspberry Pi + eInk-Display, angebunden an Microsoft Exchange Online über die Microsoft Graph API.

- **URL:** https://room-booking.luwilab.work
- **Server:** Port 3002, via PM2, hinter Nginx (SSL)

## Dokumentation

Vollständige Dokumentation im [`docs/`](docs/README.md)-Verzeichnis:

| Dokument | Beschreibung |
|---|---|
| [docs/architecture.md](docs/architecture.md) | Systemarchitektur, Datenfluss, Komponentenübersicht |
| [docs/setup.md](docs/setup.md) | Ersteinrichtung: Azure, Datenbank, Server, Nginx, PM2 |
| [docs/api.md](docs/api.md) | Alle API-Endpunkte |
| [docs/database.md](docs/database.md) | Datenbankschema, Prisma-Modelle, Migrationen |
| [docs/graph.md](docs/graph.md) | Microsoft Graph API — Verbindung, Webhooks |
| [docs/display.md](docs/display.md) | Raspberry Pi / eInk-Display — Hardware, Software |
| [docs/operations.md](docs/operations.md) | Betrieb, PM2, Nginx, Cron-Jobs, Fehlersuche |

## Schnellstart

```bash
cd /opt/room-booking
npm install
npm run build
pm2 start ecosystem.config.js
```
