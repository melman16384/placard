# Placard — Dokumentation

Joan-Tablet-Ersatz auf Basis von Raspberry Pi + eInk-Display, angebunden an Microsoft Exchange Online über die Microsoft Graph API.

## Inhalt

| Dokument | Beschreibung |
|---|---|
| [deployment-ubuntu.md](deployment-ubuntu.md) | **Vollständige Deployment-Anleitung für Ubuntu Server (von Null bis Produktion)** |
| [architecture.md](architecture.md) | Systemarchitektur, Datenfluss, Komponentenübersicht |
| [setup.md](setup.md) | Kurzreferenz: Azure, Datenbank, Server, Nginx, PM2 |
| [api.md](api.md) | Alle API-Endpunkte mit Parametern und Rückgabewerten |
| [database.md](database.md) | Datenbankschema, Prisma-Modelle, Migrationen |
| [graph.md](graph.md) | Microsoft Graph API — Verbindung, Webhooks, Kalenderoperationen |
| [display.md](display.md) | Raspberry Pi / eInk-Display — Hardware, Schaltplan, Software |
| [operations.md](operations.md) | Betrieb, PM2, Nginx, Cron-Jobs, Fehlersuche |

## Schnellübersicht

```
Exchange Online ──► Microsoft Graph API ──► Middleware (Next.js)
                                                    │
                                          ┌─────────┼──────────┐
                                          │         │          │
                                     Admin-      Display-   Webhook-
                                     Panel       API        Empfang
                                          │         │
                                     Browser    Pi Zero 2W
                                                (eInk HAT)
```

- **Server:** Port 3002, via PM2, hinter Nginx (SSL)
- **Datenbank:** PostgreSQL 16, lokal, Benutzer `room_booking_user`
- **Prozess:** `pm2 status placard`
