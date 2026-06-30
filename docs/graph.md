# Microsoft Graph API

## Übersicht

Die Middleware kommuniziert als **App-only** mit Microsoft Graph (kein Benutzerkontext). Die App liest und schreibt direkt in die Exchange-Ressourcenpostfächer der Räume.

## Azure App Registration

| Feld | Wert |
|---|---|
| Typ | App Registration (nicht Enterprise App) |
| Authentifizierung | Client Credentials (Tenant ID + Client ID + Client Secret) |
| Berechtigungstyp | Anwendungsberechtigungen (nicht delegiert) |

### Benötigte Graph-Berechtigungen

| Berechtigung | Typ | Verwendung |
|---|---|---|
| `Calendars.ReadWrite` | Anwendung | Termine lesen + ad-hoc Buchungen erstellen |
| `Calendars.Read` | Anwendung | (alternativ, falls kein Schreibzugriff gewünscht) |
| `Place.Read.All` | Anwendung | Optional: Raumliste aus Exchange abrufen |

> **Wichtig:** Alle Berechtigungen benötigen Admin-Zustimmung im Azure Portal.

## Implementierung

Datei: `src/lib/graph.ts`

```typescript
// Authentifizierung via ClientSecretCredential
const credential = new ClientSecretCredential(
  AZURE_TENANT_ID,
  AZURE_CLIENT_ID,
  AZURE_CLIENT_SECRET
)

const authProvider = new TokenCredentialAuthenticationProvider(credential, {
  scopes: ['https://graph.microsoft.com/.default'],
})
```

## Kalender-Operationen

### Termine abrufen

```
GET /users/{raumEmail}/calendar/calendarView
  ?startDateTime=...
  ?endDateTime=...
  ?$select=id,subject,start,end,organizer,isAllDay,isCancelled
  ?$orderby=start/dateTime asc
  ?$top=50
```

Gibt alle Termine für heute zurück. Abgesagte Termine (`isCancelled: true`) werden herausgefiltert.

### Termin erstellen (Ad-hoc)

```
POST /users/{raumEmail}/calendar/events
{
  "subject": "Ad-hoc Buchung — Max Mustermann",
  "start": { "dateTime": "...", "timeZone": "UTC" },
  "end":   { "dateTime": "...", "timeZone": "UTC" },
  "showAs": "busy"
}
```

### Verbindung testen

```
GET /organization
```

Einfachster Endpunkt zur Prüfung ob die App-Credentials gültig sind (genutzt in `/status`).

---

## Webhooks (Change Notifications)

### Konzept

Graph sendet bei Kalenderänderungen einen POST an die Middleware-URL. Damit bekommt das System Änderungen quasi in Echtzeit — der Pi muss nicht dauerhaft pollen.

```
Exchange-Termin ändert sich
  → Graph sendet POST /api/graph/webhook
  → Middleware aktualisiert room.updatedAt
  → Nächster Pi-Poll (60 Sek.) bekommt aktuelle Daten
```

### Subscription erstellen

```
POST /subscriptions
{
  "changeType": "created,updated,deleted",
  "notificationUrl": "https://DEINE_DOMAIN.de/api/graph/webhook",
  "resource": "/users/{raumEmail}/events",
  "expirationDateTime": "...",      // max. ~3 Tage für Kalender
  "clientState": "GRAPH_WEBHOOK_SECRET"
}
```

### Ablaufzeiten

| Ressource | Maximale Laufzeit |
|---|---|
| Kalender-Events | 4 230 Minuten (~3 Tage) |
| Implementiert | 23 Stunden (konservativ) |

**Erneuerung:** Alle 6 Stunden via Cron → `/api/cron/renew-subscriptions`

### Validation Request

Bei Subscription-Erstellung schickt Graph einen GET/POST mit `?validationToken=...`. Der Endpunkt muss den Token als Plain-Text zurückgeben (HTTP 200). Das ist in `src/app/api/graph/webhook/route.ts` implementiert.

### Sicherheit

Eingehende Notifications enthalten `clientState`. Dieser wird gegen `GRAPH_WEBHOOK_SECRET` geprüft. Abweichende Requests werden mit HTTP 400 abgelehnt.

---

## Fehlerbehandlung

| HTTP-Code | Bedeutung | Aktion |
|---|---|---|
| 401 | Token ungültig/abgelaufen | Azure-Credentials prüfen |
| 403 | Keine Berechtigung | Admin-Zustimmung in Azure erteilen |
| 404 | Raumpostfach nicht gefunden | `msEmail` im Raum prüfen |
| 429 | Rate Limit | Automatische Wiederholung (Graph-Client built-in) |
| 503 | Graph temporär nicht verfügbar | Fallback auf lokale DB greift |

Die Display-API fällt bei Graph-Fehlern automatisch auf die lokale `bookings`-Tabelle zurück.
