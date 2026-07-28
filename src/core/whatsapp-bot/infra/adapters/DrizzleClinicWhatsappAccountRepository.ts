import { and, eq, isNotNull, lte } from "drizzle-orm";

import type { ClinicWhatsappAccountRepositoryPort } from "../../application/ports/ClinicWhatsappAccountRepositoryPort";
import { ClinicWhatsappAccount } from "../../domain/ClinicWhatsappAccount";
import type { StatusClinicWhatsappAccount } from "../../domain/StatusClinicWhatsappAccount";
import { isStatusClinicWhatsappAccount } from "../../domain/StatusClinicWhatsappAccount";
import type { db as Db } from "@/db";
import { clinicWhatsappAccount as contaTable } from "@/db/schema";

type Database = typeof Db;

export class DrizzleClinicWhatsappAccountRepository
  implements ClinicWhatsappAccountRepositoryPort
{
  constructor(private readonly db: Database) {}

  async salvar(conta: ClinicWhatsappAccount): Promise<void> {
    await this.db
      .insert(contaTable)
      .values({
        id: conta.id,
        clinicaId: conta.clinicaId,
        wabaId: conta.wabaId,
        phoneNumberId: conta.phoneNumberId,
        accessTokenCriptografado: conta.accessTokenCriptografado,
        status: conta.status,
        conectadoEm: conta.conectadoEm,
        tokenExpiraEm: conta.tokenExpiraEm,
      })
      .onConflictDoUpdate({
        target: contaTable.id,
        set: {
          clinicaId: conta.clinicaId,
          wabaId: conta.wabaId,
          phoneNumberId: conta.phoneNumberId,
          accessTokenCriptografado: conta.accessTokenCriptografado,
          status: conta.status,
          conectadoEm: conta.conectadoEm,
          tokenExpiraEm: conta.tokenExpiraEm,
        },
      });
  }

  async buscarPorClinicaId(
    clinicaId: string,
  ): Promise<ClinicWhatsappAccount | null> {
    const row = await this.db.query.clinicWhatsappAccount.findFirst({
      where: eq(contaTable.clinicaId, clinicaId),
    });
    return row ? toDomain(row) : null;
  }

  async buscarPorPhoneNumberId(
    phoneNumberId: string,
  ): Promise<ClinicWhatsappAccount | null> {
    const row = await this.db.query.clinicWhatsappAccount.findFirst({
      where: eq(contaTable.phoneNumberId, phoneNumberId),
    });
    return row ? toDomain(row) : null;
  }

  async listarConectadasComTokenExpirandoAte(
    limiteExpiracao: Date,
  ): Promise<ClinicWhatsappAccount[]> {
    const rows = await this.db.query.clinicWhatsappAccount.findMany({
      where: and(
        eq(contaTable.status, "conectado"),
        isNotNull(contaTable.tokenExpiraEm),
        lte(contaTable.tokenExpiraEm, limiteExpiracao),
      ),
    });
    return rows.map(toDomain);
  }
}

function toDomain(row: {
  id: string;
  clinicaId: string;
  wabaId: string | null;
  phoneNumberId: string | null;
  accessTokenCriptografado: string | null;
  status: string;
  conectadoEm: Date | null;
  tokenExpiraEm: Date | null;
}): ClinicWhatsappAccount {
  if (!isStatusClinicWhatsappAccount(row.status)) {
    throw new Error(
      `Status inválido em clinic_whatsapp_account: ${row.status}`,
    );
  }
  return ClinicWhatsappAccount.reconstituir({
    id: row.id,
    clinicaId: row.clinicaId,
    wabaId: row.wabaId,
    phoneNumberId: row.phoneNumberId,
    accessTokenCriptografado: row.accessTokenCriptografado,
    status: row.status as StatusClinicWhatsappAccount,
    conectadoEm: row.conectadoEm,
    tokenExpiraEm: row.tokenExpiraEm,
  });
}
