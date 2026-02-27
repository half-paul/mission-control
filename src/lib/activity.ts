import { db } from "./db";
import { activityLog } from "./db/schema";
import { broadcast } from "./sse";

export async function logActivity(
  eventType: string,
  entityType: string,
  entityId: string,
  actorId: string | null,
  metadata?: Record<string, unknown>
) {
  const [entry] = await db
    .insert(activityLog)
    .values({
      eventType,
      entityType,
      entityId,
      actorId,
      metadata,
    })
    .returning();

  // Broadcast SSE event
  broadcast(eventType, {
    id: entry.id,
    eventType,
    entityType,
    entityId,
    actorId,
    metadata,
    createdAt: entry.createdAt,
  });

  return entry;
}
