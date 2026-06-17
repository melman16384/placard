import { ClientSecretCredential } from '@azure/identity'
import { Client } from '@microsoft/microsoft-graph-client'
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials'

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

// Singleton in dev mode
const globalForGraph = globalThis as unknown as { graph: Client | undefined }
export const graphClient =
  globalForGraph.graph ?? createGraphClient()

if (process.env.NODE_ENV !== 'production') globalForGraph.graph = graphClient

// ---- Calendar helpers ----

export interface GraphEvent {
  id: string
  subject: string
  body?: { content: string }
  start: { dateTime: string; timeZone: string }
  end: { dateTime: string; timeZone: string }
  organizer?: { emailAddress: { name: string; address: string } }
  isAllDay?: boolean
  isCancelled?: boolean
}

/** Fetch today's events for a room mailbox */
export async function getRoomEventsToday(roomEmail: string): Promise<GraphEvent[]> {
  const now = new Date()
  const startOfDay = new Date(now)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(now)
  endOfDay.setHours(23, 59, 59, 999)

  const result = await graphClient
    .api(`/users/${roomEmail}/calendar/calendarView`)
    .query({
      startDateTime: startOfDay.toISOString(),
      endDateTime: endOfDay.toISOString(),
      $select: 'id,subject,start,end,organizer,isAllDay,isCancelled',
      $orderby: 'start/dateTime asc',
      $top: 50,
    })
    .get()

  return (result.value as GraphEvent[]).filter((e) => !e.isCancelled)
}

/** Create an event in the room's calendar (ad-hoc booking) */
export async function createRoomEvent(
  roomEmail: string,
  subject: string,
  startTime: Date,
  endTime: Date,
  organizerName: string
): Promise<GraphEvent> {
  const event = await graphClient
    .api(`/users/${roomEmail}/calendar/events`)
    .post({
      subject,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'UTC',
      },
      body: {
        contentType: 'text',
        content: `Ad-hoc Buchung über Raumbuchungssystem — ${organizerName}`,
      },
      showAs: 'busy',
    })

  return event
}

/** Subscribe to change notifications for a room calendar */
export async function subscribeToRoomCalendar(
  roomEmail: string,
  webhookUrl: string
): Promise<{ id: string; expirationDateTime: string }> {
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 23) // Graph max for calendar is 4230 min (~3 days), use 23h

  const subscription = await graphClient.api('/subscriptions').post({
    changeType: 'created,updated,deleted',
    notificationUrl: webhookUrl,
    resource: `/users/${roomEmail}/events`,
    expirationDateTime: expiresAt.toISOString(),
    clientState: process.env.GRAPH_WEBHOOK_SECRET,
  })

  return subscription
}

/** Renew an existing subscription */
export async function renewSubscription(subscriptionId: string): Promise<string> {
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 23)

  const updated = await graphClient
    .api(`/subscriptions/${subscriptionId}`)
    .patch({ expirationDateTime: expiresAt.toISOString() })

  return updated.expirationDateTime
}

/** Delete a subscription */
export async function deleteSubscription(subscriptionId: string): Promise<void> {
  await graphClient.api(`/subscriptions/${subscriptionId}`).delete()
}
