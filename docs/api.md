# API-Referenz

Alle Endpunkte unterhalb von `/api/`. Authentifizierung wo angegeben via NextAuth-Session-Cookie.

---

## Räume

### `GET /api/rooms`
Alle Räume auflisten.
- **Auth:** Admin-Session
- **Antwort:** `Room[]`

### `POST /api/rooms`
Neuen Raum erstellen.
- **Auth:** Admin-Session
- **Body:** `{ name, capacity, floor?, amenities?, description?, color?, msEmail? }`
- **Antwort:** `Room`

### `GET /api/rooms/[id]`
Einzelnen Raum laden.
- **Auth:** Admin-Session
- **Antwort:** `Room`

### `PUT /api/rooms/[id]`
Raum aktualisieren.
- **Auth:** Admin-Session
- **Body:** Beliebige Room-Felder (partiell)
- **Antwort:** `Room`

### `DELETE /api/rooms/[id]`
Raum löschen (kaskadiert auf Bookings).
- **Auth:** Admin-Session
- **Antwort:** `{ success: true }`

### `GET /api/rooms/[id]/test`
Exchange-Verbindung für einen Raum testen.
- **Auth:** Admin-Session
- **Antwort (Erfolg):** `{ ok: true, latencyMs: number, eventsToday: number, email: string }`
- **Antwort (Fehler):** `{ ok: false, error: string }`
- **Fehlermeldungen:** `"Raumkonto nicht gefunden (404)"`, `"Keine Berechtigung (403)"`, `"Authentifizierungsfehler (401)"`

---

## Display (öffentlich)

### `GET /api/display/[roomId]`
Aktuelle Belegungsdaten für einen Raum — wird vom Pi abgefragt.
- **Auth:** Keine (öffentlich)
- **Antwort:**
```json
{
  "room": { "id", "name", "capacity", "floor", "color", "msEmail" },
  "source": "exchange" | "local",
  "isOccupied": boolean,
  "currentBooking": { "title", "startTime", "endTime" } | null,
  "upcomingBookings": [{ "title", "startTime", "endTime" }]
}
```
- **Logik:** Falls `msEmail` gesetzt → Graph API (`calendarView`). Bei Graph-Fehler oder fehlendem `msEmail` → lokale Bookings-Tabelle als Fallback.

---

## Buchungen

### `POST /api/bookings/adhoc`
Ad-hoc-Buchung vom Tablet-Display aus.
- **Auth:** Keine (öffentlich)
- **Body:** `{ roomId: string, durationMinutes: 30|60|90, displayName: string }`
- **Logik:** Prüft Überschneidungen im Exchange-Kalender, erstellt Event via Graph API
- **Antwort (Erfolg):** `{ ok: true, event: GraphEvent }`
- **Antwort (Konflikt):** `{ error: "Raum ist bereits belegt" }` (HTTP 409)

### `GET /api/bookings`
Alle lokalen Buchungen.
- **Auth:** Admin-Session

### `POST /api/bookings`
Lokale Buchung erstellen (Fallback ohne Exchange).
- **Auth:** Admin-Session
- **Body:** `{ roomId, title, startTime, endTime, description? }`

### `DELETE /api/bookings/[id]`
Buchung löschen.
- **Auth:** Admin-Session

---

## Benutzer (Admin)

### `GET /api/admin/users`
Alle Admin-Benutzer auflisten.
- **Auth:** Admin-Session
- **Antwort:** `{ id, name, email, role, createdAt }[]`

### `POST /api/admin/users`
Neuen Admin anlegen.
- **Auth:** Admin-Session
- **Body:** `{ name: string, email: string, password: string }`
- **Antwort:** `{ id, name, email, role, createdAt }` (HTTP 201)
- **Fehler:** HTTP 409 wenn E-Mail bereits vergeben

### `PATCH /api/admin/users/[id]`
Benutzerdaten ändern (Name, E-Mail, Passwort).
- **Auth:** Admin-Session
- **Body:** `{ name?, email?, password? }` (alle optional)
- **Antwort:** Aktualisierter User

### `DELETE /api/admin/users/[id]`
Benutzer löschen.
- **Auth:** Admin-Session
- **Schutz:** Kann sich nicht selbst löschen; letzter Admin kann nicht gelöscht werden

---

## Microsoft Graph

### `POST /api/graph/subscribe`
Webhook-Subscriptions für alle Räume mit `msEmail` erstellen.
- **Auth:** Admin-Session
- **Logik:** Erstellt Subscription für jeden Raum, speichert `graphSubscriptionId` und `subscriptionExpiry` in DB
- **Laufzeit:** 23 Stunden (Graph-Maximum für Kalender-Subscriptions)

### `PUT /api/graph/subscribe`
Subscriptions erneuern, die innerhalb von 2 Stunden ablaufen.
- **Auth:** Admin-Session

### `POST /api/graph/webhook`
Eingehende Change Notifications von Microsoft Graph empfangen.
- **Auth:** Keine (Graph validiert über `clientState = GRAPH_WEBHOOK_SECRET`)
- **Validation-Request:** Falls `?validationToken=...` im Query → Token zurückgeben (Graph-Anforderung bei Subscription-Erstellung)
- **Notification:** `room.updatedAt` aktualisieren → nächster Pi-Poll bekommt frische Daten

---

## Cron

### `GET /api/cron/renew-subscriptions`
Subscriptions automatisch erneuern (für externen Cron-Job).
- **Auth:** Bearer-Token (`Authorization: Bearer CRON_SECRET`)
- **Logik:** Erneuert Subscriptions die in < 2h ablaufen; resubscribet abgelaufene Subscriptions
- **Aufruf:** `curl -H "Authorization: Bearer $CRON_SECRET" https://room-booking.luwilab.work/api/cron/renew-subscriptions`
- **Empfehlung:** Alle 6 Stunden via systemd-Timer oder crontab
