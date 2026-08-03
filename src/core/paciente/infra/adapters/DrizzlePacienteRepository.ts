import { and, eq } from "drizzle-orm";

import type { PacienteRepositoryPort } from "../../application/ports/PacienteRepositoryPort";
import { Cpf } from "../../domain/Cpf";
import { Paciente } from "../../domain/Paciente";
import type { db as Db } from "@/db";
import { paciente as pacienteTable } from "@/db/schema";

type Database = typeof Db;

export class DrizzlePacienteRepository implements PacienteRepositoryPort {
  constructor(private readonly db: Database) {}

  async salvar(paciente: Paciente): Promise<void> {
    await this.db
      .insert(pacienteTable)
      .values({
        id: paciente.id,
        clinicaId: paciente.clinicaId,
        nome: paciente.nome,
        cpf: paciente.cpf.valor,
        telefone: paciente.telefone,
        dataNascimento: paciente.dataNascimento,
        contatoEmergencia: paciente.contatoEmergencia,
      })
      .onConflictDoUpdate({
        target: pacienteTable.id,
        set: {
          clinicaId: paciente.clinicaId,
          nome: paciente.nome,
          // CPF omitido no update — imutável após criação (spec 002, decisão 13)
          telefone: paciente.telefone,
          dataNascimento: paciente.dataNascimento,
          contatoEmergencia: paciente.contatoEmergencia,
        },
      });
  }

  async buscarPorId(
    clinicaId: string,
    pacienteId: string,
  ): Promise<Paciente | null> {
    const row = await this.db.query.paciente.findFirst({
      where: and(
        eq(pacienteTable.id, pacienteId),
        eq(pacienteTable.clinicaId, clinicaId),
      ),
    });
    return row ? toDomain(row) : null;
  }

  async listarPorClinica(clinicaId: string): Promise<Paciente[]> {
    const rows = await this.db.query.paciente.findMany({
      where: eq(pacienteTable.clinicaId, clinicaId),
    });
    return rows.map(toDomain);
  }
}

function toDomain(row: {
  id: string;
  clinicaId: string;
  nome: string;
  cpf: string;
  telefone: string;
  dataNascimento: Date;
  contatoEmergencia: string | null;
}): Paciente {
  return Paciente.reconstituir({
    id: row.id,
    clinicaId: row.clinicaId,
    nome: row.nome,
    cpf: Cpf.criar(row.cpf),
    telefone: row.telefone,
    dataNascimento: row.dataNascimento,
    contatoEmergencia: row.contatoEmergencia,
  });
}
