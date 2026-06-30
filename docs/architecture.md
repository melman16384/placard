# Architektur

## Systemübersicht

```
┌──────────────────────────────────────────────────────────────┐
│  Microsoft 365 (Exchange Online)                             │
│  Raumpostfächer: raum-a@firma.de, raum-b@firma.de …         │
└─────────────────────────┬────────────────────────────────────┘
                          │  Microsoft Graph API
                          │  (App-only Auth, Client Credentials)
                          ▼
┌──────────────────────────────────────────────────────────────┐
│  Middleware — Next.js 16 (App Router)                        │
│  /opt/placard  │  Port 3002  │  PM2                     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  Admin-Panel │  │  Display-API │  │  Webhook-Empfang  │  │
│  │  /rooms      │  │  /api/display│  │  /api/graph/      │  │
│  │  /users      │  │  /[roomId]   │  │  webhook          │  │
│  │  /status     │  └──────────────┘  └───────────────────┘  │
│  │  /setup      │         ▲                    ▲             │
│  └──────────────┘         │                    │             │
│         ▲                 │             Graph Change         │
│         │ Browser      HTTP Poll        Notifications        │
│      Admin            (60 Sek.)        (Push, sofort)        │
└──────────────────────────────────────────────────────────────┘
                          ▲
                    Nginx (Port 443)
                    SSL via Cloudflare
                          ▲
                     Internet
                          │
              ┌───────────┴────────────┐
              │                        │
         Admin-Browser          Raspberry Pi Zero 2W
         (Verwaltung)           (eInk-Display, WLAN)
                                Pro Raum 1 Gerät
```

## Technologie-Stack

| Schicht | Technologie | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16 |
| Sprache | TypeScript | 5 |
| ORM | Prisma | 5 |
| Datenbank | PostgreSQL | 16 |
| Auth | NextAuth v5 (beta) | 5.x |
| Graph-Client | @microsoft/microsoft-graph-client | latest |
| Azure Auth | @azure/identity (ClientSecretCredential) | latest |
| CSS | Tailwind CSS | 4 |
| Icons | lucide-react | latest |
| Prozess | PM2 | latest |
| Reverse Proxy | Nginx | — |

## Datenfluss

### Normaler Anzeigebetrieb

```
Pi Zero 2W
  └── GET /api/display/{roomId}  (alle 60 Sek.)
        └── Prisma: Room laden
              └── room.msEmail gesetzt?
                    ja: Graph API → /users/{email}/calendar/calendarView
                    nein: lokale Bookings-Tabelle
              └── Antwort: { room, isOccupied, currentBooking, upcomingBookings }
```

### Echtzeit-Synchronisation via Webhook

```
Exchange-Kalender ändert sich
  └── Graph sendet POST /api/graph/webhook
        └── clientState prüfen (GRAPH_WEBHOOK_SECRET)
        └── room.updatedAt aktualisieren
              └── nächster Poll des Pi bekommt neue Daten
```

### Ad-hoc Buchung vom Tablet

```
Nutzer tippt auf Display (30/60/90 Min)
  └── POST /api/bookings/adhoc
        { roomId, durationMinutes, displayName }
        └── Überschneidungen prüfen (Graph calendarView)
        └── Graph: POST /users/{email}/calendar/events
        └── Exchange-Kalender aktualisiert
```

## Authentifizierung

- **Admin-Panel:** NextAuth v5, JWT-Session, Credentials Provider (E-Mail + bcrypt-Passwort)
- **Display-API `/api/display/*`:** Öffentlich (kein Auth) — kein Session-Cookie auf Pi nötig
- **Ad-hoc-Buchung `/api/bookings/adhoc`:** Öffentlich — Pi braucht kein Login
- **Graph API:** App-only Auth via `ClientSecretCredential` (kein Benutzerkontext)

## Middleware-Matcher

`src/middleware.ts` schützt alle Routen außer:
- `/api/*` (eigene Auth-Prüfung je Endpunkt)
- `/_next/*` (statische Assets)
- `/display/*` (öffentlich für Pi-Displays)
- `/guide` (öffentlich, Hardware-Anleitung)
- `/deployment` (öffentlich, Server-Deployment-Anleitung)
