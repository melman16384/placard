# Datenbank

## Verbindung

- **Engine:** PostgreSQL 16
- **Datenbank:** `room_booking`
- **Benutzer:** `room_booking_user`
- **Host:** `localhost:5432`
- **ORM:** Prisma 5

Schema: `/opt/room-booking/prisma/schema.prisma`

---

## Modelle

### User

```prisma
model User {
  id        String    @id @default(cuid())
  email     String    @unique
  name      String?
  password  String                    // bcrypt-Hash (12 Runden)
  role      Role      @default(USER)  // nur ADMIN genutzt
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  bookings  Booking[]
  @@map("users")
}

enum Role { USER ADMIN }
```

**Hinweise:**
- Passwörter werden mit `bcryptjs` (cost factor 12) gehasht
- `role: USER` existiert im Schema, wird im Betrieb nicht genutzt — alle Benutzer sind ADMIN
- Registrierung ist deaktiviert; neue Benutzer nur über `/users` im Admin-Panel

### Room

```prisma
model Room {
  id                  String    @id @default(cuid())
  name                String
  capacity            Int
  floor               String?
  amenities           String[]
  description         String?
  color               String    @default("#3B82F6")
  msEmail             String?   @unique  // Exchange-Ressourcenpostfach-Adresse
  graphSubscriptionId String?            // Microsoft Graph Subscription-ID
  subscriptionExpiry  DateTime?          // Ablaufzeit der Subscription
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  bookings            Booking[]
  @@map("rooms")
}
```

**Hinweise:**
- `msEmail` ist optional — Räume ohne Exchange-Verknüpfung nutzen die lokale `bookings`-Tabelle
- `graphSubscriptionId` + `subscriptionExpiry` werden von `/api/graph/subscribe` befüllt
- `updatedAt` wird bei eingehenden Webhooks aktualisiert (Trigger für Pi-Poll)

### Booking

```prisma
model Booking {
  id          String   @id @default(cuid())
  title       String
  description String?
  startTime   DateTime
  endTime     DateTime
  roomId      String
  userId      String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@map("bookings")
}
```

**Hinweise:**
- Wird nur genutzt wenn `room.msEmail` nicht gesetzt (lokaler Fallback)
- Bei Exchange-verknüpften Räumen ist Exchange die Source of Truth

---

## Migrationen

```bash
# Schema-Änderung anwenden (Produktion)
npx prisma migrate deploy

# Neue Migration erstellen (Entwicklung)
npx prisma migrate dev --name beschreibung

# Schema-Status prüfen
npx prisma migrate status

# Prisma Client neu generieren (nach Schema-Änderung)
npx prisma generate
```

Migrationen liegen in: `/opt/room-booking/prisma/migrations/`

---

## Nützliche Abfragen

```bash
# Prisma Studio (GUI im Browser)
npx prisma studio

# Direkter DB-Zugriff
psql -U room_booking_user -d room_booking

# Alle Räume mit Webhook-Status
SELECT name, ms_email, graph_subscription_id, subscription_expiry FROM rooms;

# Alle Admins
SELECT name, email, role, created_at FROM users ORDER BY created_at;

# Webhook-Subscriptions die in < 24h ablaufen
SELECT name, subscription_expiry
FROM rooms
WHERE subscription_expiry < NOW() + INTERVAL '24 hours'
  AND ms_email IS NOT NULL;
```
