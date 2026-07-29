import { eq } from "drizzle-orm";

import type { db as Db } from "@/db";
import { eventoWebhookProcessado as eventoTable } from "@/db/schema";

import type { EventoWebhookProcessadoPort } from "../../application/ports/EventoWebhookProcessadoPort";

type Database = typeof Db;

export class DrizzleEventoWebhookProcessadoAdapter
  implements EventoWebhookProcessadoPort
{
  constructor(private readonly db: Database) {}

  async jaProcessado(eventoId: string): Promise<boolean> {
    const row = await this.db.query.eventoWebhookProcessado.findFirst({
      where: eq(eventoTable.eventoId, eventoId),
    });
    return row != null;
  }

  async marcarProcessado(
    eventoId: string,
    processadoEm: Date = new Date(),
  ): Promise<void> {
    await this.db
      .insert(eventoTable)
      .values({ eventoId, processadoEm })
      .onConflictDoNothing({ target: eventoTable.eventoId });
  }
}
