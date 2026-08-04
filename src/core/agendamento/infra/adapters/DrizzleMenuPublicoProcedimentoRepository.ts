import { eq } from "drizzle-orm";

import type { MenuPublicoProcedimentoRepositoryPort } from "../../application/ports/MenuPublicoProcedimentoRepositoryPort";
import { MenuPublicoProcedimento } from "../../domain/MenuPublicoProcedimento";
import type { db as Db } from "@/db";
import { menuPublicoProcedimento as menuTable } from "@/db/schema";

type Database = typeof Db;

export class DrizzleMenuPublicoProcedimentoRepository
  implements MenuPublicoProcedimentoRepositoryPort
{
  constructor(private readonly db: Database) {}

  async salvar(menu: MenuPublicoProcedimento): Promise<void> {
    await this.db
      .insert(menuTable)
      .values({
        clinicaId: menu.clinicaId,
        itens: [...menu.itens],
      })
      .onConflictDoUpdate({
        target: menuTable.clinicaId,
        set: {
          itens: [...menu.itens],
        },
      });
  }

  async buscarPorClinicaId(clinicaId: string): Promise<MenuPublicoProcedimento> {
    const row = await this.db.query.menuPublicoProcedimento.findFirst({
      where: eq(menuTable.clinicaId, clinicaId),
    });
    if (!row) {
      return MenuPublicoProcedimento.vazio(clinicaId);
    }
    return MenuPublicoProcedimento.reconstituir({
      clinicaId: row.clinicaId,
      itens: row.itens,
    });
  }
}
