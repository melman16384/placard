# Placard — Codebase-Dokumentation

Detaillierte Erklärung der Projektstruktur, aller Module und wie die einzelnen Teile zusammenspielen. Zielgruppe: Entwickler, die den Code verstehen, erweitern oder warten wollen.

---

## Inhaltsverzeichnis

1. [Überblick und Technologie-Stack](#1-überblick-und-technologie-stack)
2. [Verzeichnisstruktur](#2-verzeichnisstruktur)
3. [Einstiegspunkte und Konfiguration](#3-einstiegspunkte-und-konfiguration)
4. [Authentifizierung](#4-authentifizierung)
5. [Datenbankschicht](#5-datenbankschicht)
6. [Microsoft Graph API](#6-microsoft-graph-api)
7. [Routing und Layout-System](#7-routing-und-layout-system)
8. [API-Routen im Detail](#8-api-routen-im-detail)
9. [Admin-Frontend](#9-admin-frontend)
10. [Display-Frontend](#10-display-frontend)
11. [Dokumentationsseiten](#11-dokumentationsseiten)
12. [Shared Components und Utilities](#12-shared-components-und-utilities)
13. [Prozessmanagement und Infrastruktur](#13-prozessmanagement-und-infrastruktur)
14. [Datenflüsse von Ende zu Ende](#14-datenflüsse-von-ende-zu-ende)
15. [Sicherheitskonzept](#15-sicherheitskonzept)

---

## 1. Überblick und Technologie-Stack

Placard ist eine **Next.js 16 App-Router-Anwendung** die als Middleware zwischen Microsoft Exchange Online und Raspberry Pi eInk-Displays fungiert. Sie besteht aus drei Kernfunktionen:

- **Admin-Panel** (Browser, login-geschützt): Räume verwalten, Webhooks konfigurieren, Systemstatus überwachen
- **Display-API** (öffentlich, kein Auth): Raspberry Pi-Displays fragen hier Raumbelegungen ab
- **Webhook-Empfänger** (öffentlich, Secret-validiert): Microsoft Graph sendet hier Kalenderänderungen

```
Microsoft 365 (Exchange Online)
         │
         │  Graph API (Push + Pull)
         ▼
  Next.js 16 (Port 3002)
  ├── Admin-Panel  (/rooms, /users, /status, /setup)
  ├── Display-API  (/api/display/[roomId])
  └── Webhook      (/api/graph/webhook)
         │
    PostgreSQL 16
         │
    Nginx (Port 443)
         │
   Raspberry Pi Zero 2W (eInk-Display)
```

**Technologie-Stack:**

| Schicht | Technologie | Besonderheiten |
|---|---|---|
| Framework | Next.js 16 (App Router) | Route Groups, Server Components, async params |
| Sprache | TypeScript 5 | Strict mode, path aliases (`@/`) |
| ORM | Prisma 5 | Migrationen, Singleton-Client |
| Datenbank | PostgreSQL 16 | Lokal, Benutzer `room_booking_user` |
| Auth | NextAuth v5 (beta) | JWT-Session, Credentials Provider, bcrypt |
| Graph-Client | @microsoft/microsoft-graph-client | App-only auth, Client Credentials |
| Azure Auth | @azure/identity | `ClientSecretCredential` |
| CSS | Tailwind CSS v4 | `@theme inline` für Brand-Palette-Override |
| Icons | lucide-react | Tree-shaken, SVG |
| Datum | date-fns | Formatierung, deutsches Locale |
| Prozess | PM2 (Cluster, 2 Instanzen) | Zero-Downtime Reload |
| Proxy | Nginx | SSL-Terminierung, Reverse Proxy |

---

## 2. Verzeichnisstruktur

```
/opt/room-booking/
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── (admin)/                 # Route Group: login-geschützt, mit Navbar
│   │   │   ├── layout.tsx           # Admin-Layout: Navbar + main wrapper
│   │   │   ├── page.tsx             # Redirect → /rooms
│   │   │   ├── rooms/               # Raumverwaltung
│   │   │   │   ├── page.tsx         # Server Component: Daten laden
│   │   │   │   └── RoomAdminPanel.tsx  # Client Component: CRUD-UI
│   │   │   ├── users/               # Benutzerverwaltung
│   │   │   │   ├── page.tsx
│   │   │   │   └── UserPanel.tsx
│   │   │   ├── status/              # Systemstatus
│   │   │   │   ├── page.tsx
│   │   │   │   └── SubscribeButton.tsx
│   │   │   └── setup/               # Einrichtungsanleitung
│   │   │       ├── page.tsx
│   │   │       ├── SetupStep.tsx
│   │   │       └── CopyButton.tsx
│   │   ├── (auth)/                  # Route Group: Login
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   ├── api/                     # REST API-Endpunkte
│   │   │   ├── auth/[...nextauth]/  # NextAuth Handler
│   │   │   ├── rooms/               # Raum CRUD
│   │   │   │   ├── route.ts         # GET /rooms, POST /rooms
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts     # GET/PUT/DELETE /rooms/[id]
│   │   │   │       └── test/
│   │   │   │           └── route.ts # GET /rooms/[id]/test (Exchange-Test)
│   │   │   ├── admin/users/         # Admin-User CRUD
│   │   │   │   ├── route.ts         # GET/POST /admin/users
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts     # PATCH/DELETE /admin/users/[id]
│   │   │   ├── bookings/            # Buchungs-API
│   │   │   │   ├── route.ts         # GET/POST (lokale Buchungen)
│   │   │   │   ├── [id]/route.ts    # DELETE /bookings/[id]
│   │   │   │   └── adhoc/route.ts   # POST /bookings/adhoc (Display)
│   │   │   ├── display/[roomId]/    # Display-Abfrage für Pi
│   │   │   │   └── route.ts
│   │   │   ├── graph/               # Microsoft Graph Integration
│   │   │   │   ├── subscribe/route.ts  # Webhooks aktivieren/erneuern
│   │   │   │   └── webhook/route.ts    # Eingehende Notifications
│   │   │   └── cron/
│   │   │       └── renew-subscriptions/route.ts  # Automatische Erneuerung
│   │   ├── display/[roomId]/        # Pi-Display Webseite (öffentlich)
│   │   │   ├── page.tsx             # Server Component: initiales Laden
│   │   │   └── RoomDisplay.tsx      # Client Component: Live-Anzeige
│   │   ├── deployment/              # Deployment-Anleitung (öffentlich)
│   │   │   ├── layout.tsx           # Eigenes Layout mit Navbar
│   │   │   ├── page.tsx
│   │   │   ├── CopyButton.tsx
│   │   │   ├── PrintButton.tsx
│   │   │   └── SslTabs.tsx
│   │   ├── guide/                   # Hardware-Bauanleitung (öffentlich)
│   │   │   ├── layout.tsx           # Eigenes Layout mit Navbar
│   │   │   ├── page.tsx
│   │   │   ├── PrintButton.tsx
│   │   │   └── WiringDiagram.tsx
│   │   ├── globals.css              # Tailwind v4, Brand-Palette, Body-Styles
│   │   └── layout.tsx               # Root Layout: SessionProvider, Fonts
│   ├── components/                  # Wiederverwendbare UI-Komponenten
│   │   ├── Navbar.tsx               # Sticky Navigation
│   │   ├── PlacardLogo.tsx          # SVG-Logo als React-Komponente
│   │   ├── BookingForm.tsx          # Buchungsformular
│   │   ├── WeekCalendar.tsx         # Wochenkalender-Ansicht
│   │   └── ui/
│   │       ├── button.tsx           # Button-Varianten
│   │       ├── input.tsx            # Input mit Label
│   │       └── select.tsx           # Select mit Label
│   ├── lib/                         # Kernbibliotheken / Singleton-Clients
│   │   ├── auth.ts                  # NextAuth Konfiguration
│   │   ├── graph.ts                 # Graph-Client + Calendar-Helpers
│   │   ├── prisma.ts                # Prisma-Client Singleton
│   │   └── utils.ts                 # cn(), formatDate(), AMENITY_LABELS
│   ├── types/
│   │   ├── index.ts                 # Room, Booking, Profile Interfaces
│   │   └── next-auth.d.ts           # NextAuth Session-Typen-Erweiterung
│   └── proxy.ts                     # Next.js Middleware (Auth-Gate)
├── prisma/
│   ├── schema.prisma                # Datenbankschema
│   └── migrations/                  # Migrationshistorie
├── docs/                            # Gesamte Projektdokumentation
├── public/
│   └── favicon.svg
└── ecosystem.config.js              # PM2-Konfiguration
```

---

## 3. Einstiegspunkte und Konfiguration

### `src/app/layout.tsx` — Root Layout

Das Root Layout ist der äußerste Wrapper für alle Seiten der App. Es erledigt drei Dinge:

1. **Font-Loading** über `next/font/google` — lädt die Geist-Schrift als Variable Font und setzt sie via CSS-Klasse auf `<body>`.
2. **SessionProvider** aus `next-auth/react` — macht die Auth-Session client-seitig in allen Client Components verfügbar (notwendig für `useSession()` im Navbar).
3. **HTML-Struktur** — `<html lang="de">` mit `<body>` und dem Geist-Font.

```tsx
// Root Layout umhüllt ALLE Seiten
export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body className={geist.variable}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
```

### `src/proxy.ts` — Auth-Middleware

Diese Datei ist der **Next.js Middleware-Einstiegspunkt**. Next.js sucht automatisch nach `src/middleware.ts` oder `src/proxy.ts` (letzteres ist hier genutzt).

```typescript
export { auth as proxy } from '@/lib/auth'

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|display|guide).*)'],
}
```

Der `matcher` definiert, welche Pfade die Middleware durchläuft. Alle Routen **außer** den genannten Ausnahmen werden durch die Auth-Prüfung geschickt. Die Ausnahmen:

- `api/*` — eigene Auth-Prüfung je Endpunkt
- `_next/*` — statische Assets (würde sonst endlos schleifen)
- `display/*` — öffentlich für Pi-Displays (kein Login nötig)
- `guide` — Hardware-Anleitung öffentlich zugänglich

Die Middleware selbst ist nur ein Re-Export der `auth`-Funktion aus NextAuth. NextAuth prüft die JWT-Session und leitet bei fehlender Session auf `/login` weiter.

> **Hinweis:** `/deployment` ist NICHT in der Middleware-Ausnahmeliste — diese Seite wird trotzdem angezeigt, weil ihr eigenes `layout.tsx` keinen Auth-Check enthält. Falls `/deployment` auth-geschützt werden soll, muss es in `(admin)` verschoben werden.

### `src/app/globals.css` — Tailwind v4 + Brand-Palette

```css
@import "tailwindcss";

@theme inline {
  --color-blue-50:  #F2F3FF;
  --color-blue-500: #5B65F5;
  --color-blue-600: #4A55E8;
  /* ... vollständige Skala */
}

body {
  background: #F8F9FF;
  color: #0f172a;
}
```

Der `@theme inline`-Block überschreibt die Standard-Tailwind-Blue-Palette mit den Brand-Farben. Das bedeutet: **jede Klasse im gesamten Projekt die `blue-*` verwendet nimmt automatisch die Brand-Farbe** — kein Umbenennen nötig.

### `ecosystem.config.js` — PM2

```javascript
module.exports = {
  apps: [{
    name: 'placard',
    script: 'node_modules/.bin/next',
    args: 'start',
    cwd: '/opt/room-booking',   // Arbeitsverzeichnis
    env: { NODE_ENV: 'production', PORT: 3002 },
    instances: 2,               // 2 CPU-Kerne
    exec_mode: 'cluster',       // Node-Cluster für Zero-Downtime
    max_memory_restart: '512M',
  }],
}
```

PM2 startet zwei Next.js-Instanzen im Cluster-Modus. Eingehende Requests werden zwischen beiden verteilt. `pm2 reload placard` führt Rolling Restarts durch — eine Instanz bleibt immer aktiv.

---

## 4. Authentifizierung

### `src/lib/auth.ts` — NextAuth v5 Konfiguration

```typescript
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    Credentials({ /* ... */ })
  ],
  callbacks: { jwt(), session() }
})
```

**Wie die Auth funktioniert:**

1. **Provider:** `Credentials` — kein OAuth, keine externen Provider. Benutzer geben E-Mail + Passwort ein.
2. **`authorize()`:** Sucht den User in der DB per E-Mail. Vergleicht das eingegebene Passwort mit dem bcrypt-Hash (12 Runden) in der Datenbank. Gibt `null` zurück bei Fehler — NextAuth zeigt dann einen generischen Fehler.
3. **JWT-Callbacks:** Nach erfolgreichem Login wird das JWT um `id` und `role` erweitert. Der `session`-Callback überträgt diese Felder in die Session — damit sind sie in allen Server Components via `auth()` und in Client Components via `useSession()` verfügbar.
4. **Strategie:** `jwt` (statt `database`) — kein Session-Tabelle in der DB nötig. Das verschlüsselte JWT liegt im `authjs.session-token` Cookie.

**Wo Auth geprüft wird:**

- **Middleware** (`proxy.ts`): Schützt alle Admin-Seiten auf Routing-Ebene — nicht-eingeloggte User kommen gar nicht erst bis zu den Server Components.
- **API-Routen**: Jede auth-pflichtige Route ruft `const session = await auth()` auf und prüft `session.user.role !== 'ADMIN'`. Das ist notwendig, weil API-Routen nicht durch die Middleware-Matcher laufen.

### `src/app/(auth)/login/page.tsx`

Client Component mit einem `<form>` das `signIn('credentials', { email, password })` von NextAuth aufruft. Bei Fehler zeigt es eine Fehlermeldung. Bei Erfolg leitet NextAuth automatisch zur ursprünglich angefragten Seite weiter (oder `/`).

### `src/types/next-auth.d.ts` — Typen-Erweiterung

```typescript
declare module 'next-auth' {
  interface Session {
    user: { id: string; role: string; /* ... */ }
  }
}
```

Diese Datei erweitert das NextAuth-Session-Interface um die Felder `id` und `role`. Ohne diese Erweiterung würde TypeScript diese Felder nicht kennen.

---

## 5. Datenbankschicht

### `src/lib/prisma.ts` — Singleton-Client

```typescript
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ log: ['error'] })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

Das Singleton-Pattern verhindert, dass Next.js im **Development-Modus** bei jedem Hot-Reload einen neuen Prisma-Client erstellt. Im Development würde das schnell zur "too many connections"-Warnung führen. In Production (`NODE_ENV === 'production'`) ist das kein Problem, weil der Prozess nur einmal startet.

### Datenmodelle (`prisma/schema.prisma`)

**User** — Admin-Benutzer:
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  password  String              // bcrypt-Hash
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  bookings  Booking[]
}
```

**Room** — Besprechungsräume:
```prisma
model Room {
  id                  String    @id @default(cuid())
  name                String
  capacity            Int
  floor               String?
  amenities           String[]
  color               String    @default("#3B82F6")
  msEmail             String?   @unique   // Exchange-Ressourcenpostfach
  graphSubscriptionId String?             // Graph Webhook-Subscription
  subscriptionExpiry  DateTime?           // Ablaufzeit der Subscription
  updatedAt           DateTime  @updatedAt  // Touch by webhook → Pi refresh
  bookings            Booking[]
}
```

Das `updatedAt`-Feld des Raums hat eine besondere Rolle: Wenn ein Webhook von Microsoft Graph eingeht, wird dieses Feld auf `new Date()` gesetzt. Das ist das Signal für den Pi, beim nächsten Poll frische Daten zu holen.

**Booking** — Lokale Buchungen (Fallback ohne Exchange):
```prisma
model Booking {
  id          String   @id @default(cuid())
  title       String
  startTime   DateTime
  endTime     DateTime
  roomId      String
  userId      String
}
```

Buchungen in dieser Tabelle werden nur genutzt wenn ein Raum keine `msEmail` hat. Bei Exchange-verknüpften Räumen ist Exchange die einzige Source of Truth — lokale Buchungen spielen dort keine Rolle.

---

## 6. Microsoft Graph API

### `src/lib/graph.ts` — Client und Helper-Funktionen

**Client-Initialisierung:**

```typescript
function createGraphClient() {
  const credential = new ClientSecretCredential(
    process.env.AZURE_TENANT_ID!,
    process.env.AZURE_CLIENT_ID!,
    process.env.AZURE_CLIENT_SECRET!
  )

  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: ['https://graph.microsoft.com/.default'],
  })

  return Client.initWithMiddleware({ authProvider })
}
```

`ClientSecretCredential` aus `@azure/identity` übernimmt das Token-Management vollautomatisch: Es holt ein Access Token von Azure, cached es und erneuert es vor Ablauf. Der App-Entwickler muss sich nicht darum kümmern. Der Scope `.default` bedeutet "alle Berechtigungen, die der App im Azure Portal zugewiesen wurden".

Das Singleton-Pattern ist identisch zu Prisma — verhindert mehrere Client-Instanzen im Development.

**Helper-Funktionen:**

`getRoomEventsToday(roomEmail)` — Holt alle Termine eines Raums für heute:
```typescript
const result = await graphClient
  .api(`/users/${roomEmail}/calendar/calendarView`)
  .header('Prefer', 'outlook.timezone="UTC"')
  .query({
    startDateTime: startOfDay.toISOString(),
    endDateTime: endOfDay.toISOString(),
    $select: 'id,subject,start,end,organizer,isAllDay,isCancelled',
    $orderby: 'start/dateTime asc',
    $top: 50,
  })
  .get()

return result.value.filter((e) => !e.isCancelled)
```

Der `Prefer: outlook.timezone="UTC"` Header stellt sicher, dass alle Zeiten in UTC zurückgegeben werden — unabhängig von der Zeitzone des Raumpostfachs.

`createRoomEvent(roomEmail, subject, start, end, organizer)` — Erstellt einen Ad-hoc-Termin direkt im Exchange-Kalender des Raums.

`subscribeToRoomCalendar(roomEmail, webhookUrl)` — Erstellt eine Graph Change Notification Subscription. Die Laufzeit ist auf 23 Stunden gesetzt (das API-Maximum für Kalender-Events ist ~3 Tage, aber 23h ist konservativer für zuverlässige Erneuerung).

`renewSubscription(subscriptionId)` — Verlängert eine bestehende Subscription um weitere 23h.

`deleteSubscription(subscriptionId)` — Löscht eine Subscription bei Graph (nötig vor dem Neuerstellen).

---

## 7. Routing und Layout-System

Next.js App Router nutzt das Dateisystem für Routing. Placard nutzt dabei zwei wichtige Konzepte:

### Route Groups

Verzeichnisse in Klammern `(name)` sind **Route Groups** — sie beeinflussen die URL nicht, aber ermöglichen geteilte Layouts für eine Gruppe von Seiten.

**`(admin)` — Auth-geschützte Admin-Seiten:**

```
src/app/(admin)/layout.tsx   → gilt für /rooms, /users, /status, /setup
src/app/(admin)/rooms/page.tsx  → URL: /rooms
src/app/(admin)/users/page.tsx  → URL: /users
```

Das `(admin)/layout.tsx`:
```tsx
export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10">
        {children}
      </main>
    </div>
  )
}
```

**`(auth)` — Login-Seite:**
Eigene Group für die Login-Seite. Kein Navbar, eigenes Layout. URL: `/login`.

### Eigene Layouts für öffentliche Seiten

`/deployment` und `/guide` sind **nicht** in der `(admin)` Group — sie brauchen kein Auth-Gate. Beide haben aber trotzdem ein `layout.tsx` das die Navbar einbindet:

```tsx
// src/app/deployment/layout.tsx
export default function DeploymentLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />        {/* zeigt Navbar ohne Login-Zwang */}
      <main className="flex-1">{children}</main>
    </div>
  )
}
```

### Layout-Hierarchie

Beim Aufruf von z.B. `/rooms` wird folgende Layout-Kette aufgebaut:

```
src/app/layout.tsx          (Root: SessionProvider, Font)
  └── src/app/(admin)/layout.tsx  (Navbar + main wrapper)
        └── src/app/(admin)/rooms/page.tsx  (Seiteninhalt)
```

### Server vs. Client Components

Next.js App Router unterscheidet zwischen:

- **Server Components** (Standard): Werden auf dem Server gerendert, haben Zugriff auf Datenbank, Env-Vars, können `async` sein. **Kein** Zugriff auf Browser-APIs oder React-Hooks.
- **Client Components** (`'use client'` am Anfang): Werden im Browser hydratisiert, haben Zugriff auf `useState`, `useEffect`, `onClick` etc.

In Placard ist das Pattern durchgehend:

```
page.tsx (Server Component)
  → lädt Daten aus DB
  → gibt an Client Component weiter

XxxPanel.tsx / XxxDisplay.tsx (Client Component)
  → interaktive UI
  → fetch-Aufrufe für Mutationen
```

Beispiel:
```tsx
// rooms/page.tsx — Server Component
export default async function RoomsPage() {
  const rooms = await prisma.room.findMany()  // Datenbankzugriff direkt
  return <RoomAdminPanel rooms={rooms} />     // Client Component bekommt initiale Daten
}

// RoomAdminPanel.tsx — Client Component
'use client'
export function RoomAdminPanel({ rooms: initialRooms }) {
  const [rooms, setRooms] = useState(initialRooms)  // lokaler State
  // fetch für CRUD-Operationen
}
```

---

## 8. API-Routen im Detail

### `/api/auth/[...nextauth]`

Catch-All-Route die alle NextAuth-Endpunkte handelt: `POST /api/auth/signin`, `GET /api/auth/session`, `POST /api/auth/signout` etc. Diese Route wird von NextAuth intern genutzt und muss nicht manuell gepflegt werden.

```typescript
import { handlers } from '@/lib/auth'
export const { GET, POST } = handlers
```

---

### `/api/rooms` und `/api/rooms/[id]`

Vollständiges CRUD für Räume. Alle Endpunkte prüfen Admin-Session:

```typescript
const session = await auth()
if (!session || session.user.role !== 'ADMIN') {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
}
```

**`GET /api/rooms`** — gibt alle Räume alphabetisch sortiert zurück.

**`POST /api/rooms`** — erstellt einen Raum. `msEmail` wird auf `null` gesetzt wenn leer (nicht als leerer String gespeichert).

**`PUT /api/rooms/[id]`** — aktualisiert einen Raum vollständig.

**`DELETE /api/rooms/[id]`** — löscht Raum. Prisma cascadiert auf die `bookings`-Tabelle (schema-definiert).

---

### `/api/rooms/[id]/test`

Testet die Exchange-Verbindung eines Raums. Gibt Latenz und Anzahl der heutigen Termine zurück. Fehler werden in lesbaren Text umgewandelt:

```typescript
const msg = String(err)
return {
  ok: false,
  error: msg.includes('404') ? 'Raumkonto nicht gefunden' :
         msg.includes('403') ? 'Keine Berechtigung (Graph-App-Permission fehlt)' :
         msg.includes('401') ? 'Authentifizierung fehlgeschlagen (Azure-Credentials prüfen)' :
         msg,
}
```

---

### `/api/display/[roomId]` — Die zentrale Display-API

Diese Route ist das Herzstück des Systems. Der Raspberry Pi ruft sie alle 60 Sekunden ab.

```
GET /api/display/{roomId}
→ Kein Auth erforderlich (öffentlich)
→ Antwort: { room, source, isOccupied, currentBooking, upcomingBookings }
```

**Ablauf:**

```
1. Raum aus DB laden (Prisma)
2. Hat der Raum eine msEmail?
   JA:
     3a. Graph API: calendarView für heute abrufen (getRoomEventsToday)
     4a. Events nach UTC konvertieren, aktuell/bevorstehend klassifizieren
     5a. source: 'exchange' zurückgeben
     Bei Graph-Fehler: weiter zu Schritt 3b
   NEIN / Graph-Fehler:
     3b. Lokale bookings-Tabelle abfragen (Prisma)
     4b. source: 'local' zurückgeben
```

Die `isOccupied`-Logik:
```typescript
const current = mapped.find((e) => e.startTime <= now && e.endTime > now)
// Ein Termin ist aktiv wenn: startTime in der Vergangenheit UND endTime in der Zukunft
```

Der **Fallback auf lokale DB** bei Graph-Fehlern ist bewusst: Wenn Azure down ist oder die Credentials fehlen, zeigt das Display trotzdem die lokal gespeicherten Buchungen an.

---

### `/api/bookings/adhoc` — Ad-hoc Buchung vom Display

```
POST /api/bookings/adhoc
Body: { roomId, durationMinutes: 30|60|90, displayName? }
→ Kein Auth (öffentlich — der Pi bucht ohne Login)
```

**Ablauf:**

```
1. Input validieren (roomId, durationMinutes muss 30/60/90 sein)
2. Raum laden, prüfen ob msEmail gesetzt (Exchange nötig)
3. Aktuelle Termine holen (getRoomEventsToday)
4. Überschneidungscheck:
   → conflict = events.find(e => start < endTime && end > now)
   → Bei Konflikt: HTTP 409 mit Fehlermeldung
5. createRoomEvent() → Termin in Exchange erstellen
6. HTTP 200 mit { success, startTime, endTime }
```

Der Überschneidungscheck passiert direkt gegen Exchange — nicht gegen eine lokale Tabelle. Das verhindert Race Conditions, wenn zwei Displays gleichzeitig den gleichen Raum buchen wollen.

---

### `/api/graph/subscribe` — Webhook-Subscriptions

```
POST /api/graph/subscribe   → Alle Räume abonnieren
PUT  /api/graph/subscribe   → Ablaufende Subscriptions erneuern
→ Admin-Auth erforderlich
```

**POST — Alle Räume abonnieren:**

Iteriert über alle Räume mit `msEmail`. Für jeden Raum:
1. Bestehende Subscription löschen (falls vorhanden)
2. Neue Subscription bei Graph erstellen (`subscribeToRoomCalendar`)
3. `graphSubscriptionId` und `subscriptionExpiry` in DB speichern

**PUT — Erneuern:**

Holt alle Räume deren `subscriptionExpiry` in weniger als 2 Stunden liegt und erneuert sie via `renewSubscription()`.

---

### `/api/graph/webhook` — Eingehende Notifications

```
POST /api/graph/webhook  → Graph sendet Kalenderänderungen
GET  /api/graph/webhook  → Graph-Validierungsrequest beim Subscription-Erstellen
```

**Validation Request** (beim erstmaligen Erstellen einer Subscription):

Microsoft Graph sendet einen Request mit `?validationToken=...`. Der Endpunkt muss diesen Token als Plain Text zurückgeben. Das beweist gegenüber Graph, dass man diese URL kontrolliert.

```typescript
const validationToken = searchParams.get('validationToken')
if (validationToken) {
  return new Response(validationToken, {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  })
}
```

**Normale Notification:**

```typescript
// clientState gegen GRAPH_WEBHOOK_SECRET prüfen
if (notifications.some((n) => n.clientState !== secret)) {
  return NextResponse.json({ error: 'Invalid client state' }, { status: 401 })
}

// Betroffenen Raum identifizieren (aus resource-Pfad)
const userMatch = resource.match(/Users\/([^/]+)\//i)
const userId = userMatch[1]  // E-Mail des Raumpostfachs

// Raum in DB "touchen" → updatedAt aktualisieren
await prisma.room.updateMany({
  where: { msEmail: { equals: userId, mode: 'insensitive' } },
  data: { updatedAt: new Date() },
})
```

Der `updatedAt`-Touch ist das einzige was der Webhook tut. Der Pi bekommt die neuen Daten beim nächsten regulären Poll (max. 60 Sekunden).

---

### `/api/cron/renew-subscriptions`

```
GET /api/cron/renew-subscriptions
Header: Authorization: Bearer {CRON_SECRET}
→ Öffentlich erreichbar, aber Secret-geschützt
→ Empfehlung: alle 6 Stunden via crontab aufrufen
```

Diese Route ist der "Wächter" für Webhook-Subscriptions. Graph-Subscriptions laufen nach 23 Stunden (in dieser Implementation) ab. Der Cron-Job stellt sicher, dass sie rechtzeitig erneuert werden.

**Ablauf für jeden Raum mit msEmail:**
```
subscriptionExpiry < jetzt + 2h?
  NEIN: status 'ok', weiter
  JA, graphSubscriptionId vorhanden:
    → renewSubscription() versuchen
    → Erfolg: subscriptionExpiry in DB aktualisieren
    → Fehler (Subscription abgelaufen/gelöscht bei Graph):
        → deleteSubscription() versuchen (ignore error)
        → subscribeToRoomCalendar() neu erstellen
  JA, kein graphSubscriptionId:
    → subscribeToRoomCalendar() neu erstellen
```

Der Unterschied zwischen `renewSubscription` und `subscribeToRoomCalendar`: Renewal verlängert eine existierende Subscription-ID. Wenn die Subscription bei Graph nicht mehr existiert (z.B. weil sie ohne Erneuerung abgelaufen ist), schlägt Renewal fehl und eine neue Subscription wird erstellt.

---

### `/api/admin/users` — Benutzerverwaltung

```
GET  /api/admin/users      → Alle Admins auflisten
POST /api/admin/users      → Neuen Admin erstellen
PATCH /api/admin/users/[id] → Name/E-Mail/Passwort ändern
DELETE /api/admin/users/[id] → Admin löschen
```

Sicherheits-Checks beim Löschen:
```typescript
// Man kann sich nicht selbst löschen
if (id === session.user.id) {
  return NextResponse.json({ error: 'Kannst dich nicht selbst löschen' }, { status: 400 })
}

// Letzten Admin kann man nicht löschen
const userCount = await prisma.user.count()
if (userCount <= 1) {
  return NextResponse.json({ error: 'Letzten Admin nicht löschbar' }, { status: 400 })
}
```

Beim Erstellen und Patchen wird das Passwort mit `bcryptjs` gehasht (Cost Factor 12):
```typescript
password: await bcrypt.hash(body.password, 12)
```

---

## 9. Admin-Frontend

### `src/components/Navbar.tsx`

Die Navbar ist eine **Client Component** weil sie `useSession()` (Browser-Hook) und `usePathname()` nutzt.

```tsx
const pathname = usePathname()
const { data: session } = useSession()

const links = [
  { href: '/rooms', label: 'Räume', icon: Settings },
  { href: '/deployment', label: 'Deployment', icon: Server },
  // ...
]
```

Aktiver Link wird durch `pathname.startsWith(href)` ermittelt — das macht auch Unterseiten wie `/rooms/123` als aktiv markieren.

Styling: `sticky top-0 z-40 bg-white/95 backdrop-blur-md` — die Navbar bleibt beim Scrollen oben stehen, mit einem Frosted-Glass-Effekt.

---

### `src/app/(admin)/rooms/`

**`page.tsx` (Server Component):**
Lädt alle Räume inkl. `_count.bookings` (Anzahl Buchungen per Raum) direkt per Prisma. Gibt die Daten an `RoomAdminPanel` weiter.

**`RoomAdminPanel.tsx` (Client Component):**

Der komplexeste Teil des Admin-Panels. Handhabt:

- **CRUD-Formular**: Inline über der Tabelle, mit Farb-Picker, Ausstattungs-Checkboxen, Exchange-E-Mail-Feld
- **Optimistische Updates**: Nach API-Calls werden die lokalen Daten sofort aktualisiert (`setRooms(...)`) bevor `router.refresh()` die Server-Daten neu lädt
- **Exchange-Test**: Pro Raum gibt es einen "Test"-Button der `GET /api/rooms/[id]/test` aufruft und das Ergebnis inline in der Zeile zeigt
- **Webhook-Aktivierung**: "Webhooks aktivieren"-Button ruft `POST /api/graph/subscribe` auf
- **Lösch-Bestätigung**: Zwei-Stufen-Löschung (erst `deleteId` setzen, dann bei erneutem Klick löschen)
- **Display-Link**: Jeder Raum hat einen Link zu `/display/[id]`

---

### `src/app/(admin)/status/page.tsx`

Server Component die parallel (via `Promise.all`) ausführt:
1. DB-Verbindungstest (`prisma.$queryRaw\`SELECT 1\``)
2. Graph API-Test (`graphClient.api('/organization').get()`)
3. Alle Räume mit Subscription-Status laden

Stellt Alerts dar für:
- Abgelaufene Subscriptions (rot)
- Bald ablaufende Subscriptions (gelb)
- Räume mit Exchange ohne Subscription (grau)

**`SubscribeButton.tsx` (Client Component):** Ein einfacher Button der `POST /api/graph/subscribe` aufruft und den Status anzeigt.

---

### `src/app/(admin)/users/UserPanel.tsx`

Ähnliche Struktur wie `RoomAdminPanel`. Handhabt das Anlegen, Bearbeiten und Löschen von Admin-Benutzern. Zeigt Fehler inline an (z.B. "E-Mail bereits vergeben").

---

### `src/app/(admin)/setup/page.tsx`

**Statische Seite** (keine Datenbankabfragen) mit einer Schritt-für-Schritt-Anleitung zur Ersteinrichtung der App nach dem Deployment. Nutzt `SetupStep.tsx` und `CopyButton.tsx`.

`CopyButton.tsx` kopiert Code-Snippets in die Zwischenablage über die Clipboard-API.

---

## 10. Display-Frontend

### `src/app/display/[roomId]/page.tsx` — Server Component

```tsx
export default async function DisplayPage({ params }) {
  const { roomId } = await params
  const room = await prisma.room.findUnique({ where: { id: roomId } })
  if (!room) notFound()

  const bookings = await prisma.booking.findMany({
    where: { roomId, endTime: { gte: new Date() } },
    orderBy: { startTime: 'asc' },
  })

  return <RoomDisplay room={room} bookings={bookings} />
}
```

Lädt initiale Daten für das sofortige Rendern — das Display zeigt beim ersten Laden sofort etwas, ohne auf einen API-Call zu warten.

---

### `src/app/display/[roomId]/RoomDisplay.tsx` — Client Component

Das ist die **Live-Anzeige** die auf dem Tablet im Besprechungsraum läuft. Vollständig self-refreshing.

**State:**
```typescript
const [now, setNow] = useState(new Date())          // für Uhrzeit-Anzeige
const [data, setData] = useState<DisplayData>(...)  // aktuelle Belegungsdaten
const [showAdhoc, setShowAdhoc] = useState(false)   // Ad-hoc Buchungs-Dialog
```

**Update-Rhythmus:**
```typescript
useEffect(() => {
  fetchData()
  const dataInterval = setInterval(fetchData, 60_000)   // Daten alle 60s
  const clockInterval = setInterval(() => setNow(new Date()), 60_000)  // Uhr jede Minute
  return () => { clearInterval(dataInterval); clearInterval(clockInterval) }
}, [initialRoom.id])
```

**`fetchData()`** ruft `/api/display/{roomId}` auf und aktualisiert den State. Fehler beim Fetch werden ignoriert (zeigt weiterhin die letzten bekannten Daten).

**Ad-hoc Buchung:**

Wird nur angezeigt wenn:
- Raum hat `msEmail` (Exchange-Verbindung)
- Raum ist aktuell `isOccupied === false`

Beim Buchen:
1. Button "Jetzt buchen" → zeigt Dauer-Auswahl (30/60/90 Min)
2. Klick auf Dauer → `POST /api/bookings/adhoc`
3. Erfolg → "Buchung erstellt" 3 Sekunden anzeigen, dann `fetchData()`
4. Fehler → Fehlermeldung inline (z.B. "Raum belegt bis 15:30 Uhr")

**Styling:**

Hintergrundfarbe wechselt dynamisch:
- Verfügbar: `#F0FDF4` (helles Grün)
- Belegt: `#FEF2F2` (helles Rot)

Der Header-Balken nutzt `room.color` als Hintergrundfarbe — das erlaubt farbkodierte Räume.

---

## 11. Dokumentationsseiten

### `/deployment` — Server-Deployment-Anleitung

Eine lange statische Seite mit allem was für ein Ubuntu-Deployment nötig ist. Eigenes `layout.tsx` mit Navbar (ohne Auth). Besonderheiten:

- **Zweispaltig**: Sticky TOC-Sidebar links, Inhalt rechts
- **`SslTabs.tsx`**: Tab-Komponente für die vier SSL-Optionen (Let's Encrypt, Cloudflare, Eigenes Zertifikat, Selbstsigniert)
- **`CopyButton.tsx`**: Bash-Snippets kopierbar
- **`PrintButton.tsx`**: Löst `window.print()` aus; die Seite hat Print-spezifisches CSS das die Sidebar und Buttons ausblendet

### `/guide` — Hardware-Bauanleitung

Anleitung für den Aufbau eines Raspberry Pi eInk-Display-Geräts. Eigenes `layout.tsx` mit Navbar (ohne Auth).

- **`WiringDiagram.tsx`**: SVG-Schaltplan des GPIO-Anschlusses, als React-Komponente gerendert
- **`PrintButton.tsx`**: gleich wie in `/deployment`
- Druckoptimiert via `@media print` CSS

---

## 12. Shared Components und Utilities

### `src/components/PlacardLogo.tsx`

```tsx
export function PlacardLogo({ size = 32, className }) {
  const id = `placard-grad-${size}`  // eindeutige Gradient-ID pro Größe
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <defs>
        <linearGradient id={id}>
          <stop offset="0%" stopColor="#6B75FF" />
          <stop offset="100%" stopColor="#9B6BF5" />
        </linearGradient>
      </defs>
      <rect ... fill={`url(#${id})`} />  {/* Hintergrund */}
      {/* 4 Linien (Kalendereinträge) */}
      {/* Grüner Status-Dot */}
    </svg>
  )
}
```

Die dynamische Gradient-ID (`placard-grad-${size}`) ist wichtig: Wenn zwei `<PlacardLogo>`-Instanzen mit unterschiedlichen Größen auf derselben Seite gerendert werden, müssen die SVG-Gradient-IDs eindeutig sein — sonst referenzieren beide den gleichen Gradienten und einer sieht falsch aus.

### `src/components/Navbar.tsx`

Beschrieben in Abschnitt 9. Shared zwischen allen Layout-Typen (Admin-Group, Deployment, Guide).

### `src/components/BookingForm.tsx`

Formular zum Erstellen lokaler Buchungen (für Räume ohne Exchange). Wird im Admin-Panel eingebunden.

### `src/components/WeekCalendar.tsx`

Visualisiert Buchungen einer Woche als Kalendergitter. Berechnet Überschneidungen und stellt sie nebeneinander dar.

### `src/lib/utils.ts`

**`cn(...inputs)`** — kombiniert `clsx` (bedingte Klassen) mit `tailwind-merge` (Konflikte auflösen):
```typescript
cn('px-4', condition && 'bg-blue-600', 'bg-red-500')
// → 'px-4 bg-red-500' (bg-blue-600 wird von bg-red-500 überschrieben)
```

**Datum-Formatierung** (alle auf Deutsch via `date-fns/locale/de`):
- `formatDate()` → `"17. Juni 2026"`
- `formatTime()` → `"14:30"`
- `formatDatetime()` → `"17.06.2026 14:30"`
- `formatWeekday()` → `"Mittwoch, 17. Juni"`

**`AMENITY_LABELS`** / **`AMENITY_ICONS`** — Maps von internen Keys (`projector`, `whiteboard`, ...) zu deutschen Labels und Emojis. Zentralisiert damit Änderungen nur an einer Stelle nötig sind.

### `src/components/ui/` — UI-Primitives

**`button.tsx`** — Button-Varianten:
- `default` (primary): `bg-blue-600 text-white hover:bg-blue-700 shadow-sm`
- `secondary`: `bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100`
- `ghost`: transparent, zeigt erst bei Hover Hintergrund
- `destructive`: Rot für Löschen-Aktionen

**`input.tsx`** — Input-Feld mit optionalem `label`-Prop. Setzt automatisch eine `id` für die `label`-Verknüpfung.

**`select.tsx`** — Native `<select>` mit gleicher Styling-Logik wie Input.

### `src/types/index.ts`

TypeScript-Interfaces `Room`, `Booking`, `Profile` die project-weit als Typen dienen — unabhängig von den generierten Prisma-Typen, die manchmal zu viele oder zu wenige Felder haben.

---

## 13. Prozessmanagement und Infrastruktur

### PM2 Cluster-Modus

```
pm2 start ecosystem.config.js
→ Startet 2 Worker-Prozesse auf Port 3002
→ Nginx sendet Requests an beide (Round-Robin)

pm2 reload placard
→ Worker 1 neu starten
→ Warten bis Worker 1 "ready"
→ Worker 2 neu starten
→ Kein Moment ohne laufende Instanz
```

Wichtig: `pm2 reload` (nicht `restart`). `restart` killt beide Instanzen gleichzeitig → kurze Downtime. `reload` macht Rolling Restarts.

Bei Änderung des Prozessnamens: `pm2 delete OLD_NAME && pm2 start ecosystem.config.js`. `pm2 reload` kennt den alten Namen nicht mehr.

### Nginx

```nginx
location / {
    proxy_pass         http://localhost:3002;
    proxy_set_header   Upgrade $http_upgrade;
    proxy_set_header   Connection 'upgrade';
    # ... WebSocket-Forwarding für Next.js HMR (Dev)
}
```

Nginx terminiert SSL und leitet zu Port 3002 weiter. `proxy_set_header X-Forwarded-Proto $scheme` ist wichtig damit NextAuth weiß dass HTTPS genutzt wird (für sichere Cookie-Flags).

### `.env.local`

Alle Geheimnisse in einer Datei (nicht in Git eingecheckt):

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."              # JWT-Signierung
NEXTAUTH_URL="https://..."         # Wichtig für NextAuth Callback-URLs
NEXT_PUBLIC_APP_URL="https://..."  # In Client-Code verfügbar (Webhook-URL)
AZURE_TENANT_ID="..."
AZURE_CLIENT_ID="..."
AZURE_CLIENT_SECRET="..."
GRAPH_WEBHOOK_SECRET="..."         # Validiert eingehende Graph-Notifications
CRON_SECRET="..."                  # Schützt /api/cron/renew-subscriptions
PORT=3002
```

`NEXT_PUBLIC_`-Präfix: Variablen mit diesem Präfix werden in den Client-Bundle eingebettet. `NEXT_PUBLIC_APP_URL` wird für die Webhook-URL in `src/app/api/graph/subscribe/route.ts` genutzt.

---

## 14. Datenflüsse von Ende zu Ende

### Normaler Display-Betrieb (Pi holt Daten)

```
Pi Zero 2W (alle 60 Sekunden)
  └─ GET /api/display/{roomId}
       └─ Prisma: room.msEmail gesetzt?
            JA:  Graph API calendarView
                 → Termine filtern (isCancelled=false)
                 → isOccupied berechnen (startTime ≤ now < endTime)
                 → { source: 'exchange', isOccupied, current, upcoming }
            NEIN/Fehler:
                 → Prisma bookings-Tabelle
                 → { source: 'local', isOccupied, current, upcoming }
       └─ RoomDisplay.tsx: State updaten → re-render
```

### Echtzeit-Kalenderänderung (Webhook-Pfad)

```
Jemand erstellt/ändert Termin in Exchange
  └─ Exchange → Microsoft Graph (intern)
       └─ Graph: POST /api/graph/webhook
            └─ clientState prüfen (GRAPH_WEBHOOK_SECRET)
            └─ resource parsen: "Users/{email}/Events/{id}"
            └─ Prisma: room.updatedAt = new Date()
                 (keine weitere Aktion — nur "Dirty"-Markierung)
       └─ Pi nächster Poll (max. 60 Sek. später):
            └─ GET /api/display/{roomId}
            └─ Graph holt frische Daten
            └─ Display zeigt aktuellen Zustand
```

### Ad-hoc Buchung vom Tablet

```
Benutzer tippt auf "Jetzt buchen" (Display)
  └─ showAdhoc = true → Dauer-Auswahl erscheint
       └─ Klick auf "30 Min"
            └─ POST /api/bookings/adhoc
                 { roomId, durationMinutes: 30 }
                 └─ Raum laden, msEmail prüfen
                 └─ getRoomEventsToday() — aktuelle Exchange-Termine
                 └─ Überschneidung?
                      JA:  HTTP 409 "Raum belegt bis XX:XX Uhr"
                      NEIN: createRoomEvent() → Exchange
                            HTTP 200 { success, startTime, endTime }
            └─ UI: adhocSuccess = true → "Buchung erstellt" (3s)
            └─ fetchData() → Display aktualisiert
```

### Admin erstellt Webhook-Subscriptions

```
Admin: Räume → "Webhooks aktivieren"
  └─ POST /api/graph/subscribe
       └─ Alle Räume mit msEmail laden
       └─ For each room:
            1. Alte Subscription löschen (Graph API)
            2. Neue Subscription erstellen (Graph API)
               → notificationUrl: NEXT_PUBLIC_APP_URL/api/graph/webhook
               → expirationDateTime: jetzt + 23h
               → clientState: GRAPH_WEBHOOK_SECRET
            3. graphSubscriptionId + subscriptionExpiry in DB speichern
       └─ Graph sendet Validation-Request an /api/graph/webhook
            → ?validationToken=... → wird zurückgegeben (Handshake)
       └─ Subscription aktiv — Graph sendet ab jetzt Notifications
```

### Cron erneuert ablaufende Subscriptions

```
Server-Cron (alle 6h):
  curl -H "Authorization: Bearer {CRON_SECRET}"
       https://DEINE_DOMAIN.de/api/cron/renew-subscriptions

  └─ GET /api/cron/renew-subscriptions
       └─ Auth-Header prüfen (Bearer CRON_SECRET)
       └─ Alle Räume mit msEmail laden
       └─ For each room:
            subscriptionExpiry < jetzt + 2h?
              NEIN: 'ok'
              JA:
                graphSubscriptionId vorhanden?
                  JA:  renewSubscription(id) → Graph PATCH /subscriptions/{id}
                       Erfolg: subscriptionExpiry aktualisieren
                       Fehler: deleteSubscription() → subscribeToRoomCalendar()
                  NEIN: subscribeToRoomCalendar() (erstmals abonnieren)
```

---

## 15. Sicherheitskonzept

### Authentifizierung und Autorisierung

| Bereich | Methode |
|---|---|
| Admin-Panel (Seiten) | NextAuth JWT via Middleware → `/login` redirect |
| Admin-Panel (API) | `await auth()` + `role !== 'ADMIN'` Check in jeder Route |
| Display-API | Keine Auth — öffentlich (nur Raum-ID nötig) |
| Ad-hoc Buchung | Keine Auth — öffentlich (Pi bucht direkt) |
| Graph Webhook | `clientState === GRAPH_WEBHOOK_SECRET` |
| Cron-Endpoint | `Authorization: Bearer CRON_SECRET` Header |

### Passwort-Sicherheit

- bcrypt mit Cost Factor 12 (ca. 250ms pro Hash)
- Passwort-Hash wird niemals in API-Antworten zurückgegeben (explizites `select`)
- Kein Klartext-Passwort je in DB oder Logs

### Session-Sicherheit

- JWT-Strategie: kein DB-Lookup bei jedem Request
- `trustHost: true` in NextAuth-Config: nötig hinter Reverse Proxy (Nginx)
- Cookie: `authjs.session-token`, `HttpOnly`, `Secure` (via Nginx HTTPS)

### Webhook-Validierung

Jede eingehende Graph-Notification wird gegen `GRAPH_WEBHOOK_SECRET` geprüft. Bei Abweichung: HTTP 401. Das verhindert, dass jemand gefälschte Notifications sendet (z.B. um `room.updatedAt` zu manipulieren).

### Selbstlösch-Schutz

Ein Admin kann sich nicht selbst löschen und kann den letzten Admin nicht löschen. Das verhindert eine Situation in der niemand mehr eingeloggt ist.

### Umgebungsvariablen

- `.env.local` liegt in `.gitignore` — nie in Git eingecheckt
- Secrets werden mit `openssl rand -base64 32` generiert (256 Bit Entropie)
- `NEXT_PUBLIC_`-Variablen sind im Client-Bundle sichtbar — dort liegen nur unkritische Werte wie die App-URL
