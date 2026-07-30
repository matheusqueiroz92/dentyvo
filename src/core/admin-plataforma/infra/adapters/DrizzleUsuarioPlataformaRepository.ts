import { eq } from "drizzle-orm";

import type { UsuarioPlataformaRepositoryPort } from "../../application/ports/UsuarioPlataformaRepositoryPort";
import {
  UsuarioPlataforma,
  type UsuarioPlataformaProps,
} from "../../domain/UsuarioPlataforma";
import type { PapelPlataforma } from "../../domain/PapelPlataforma";
import type { db as Db } from "@/db";
import { usuarioPlataforma as usuarioPlataformaTable } from "@/db/schema";

type Database = typeof Db;

export class DrizzleUsuarioPlataformaRepository
  implements UsuarioPlataformaRepositoryPort
{
  constructor(private readonly db: Database) {}

  async salvar(usuario: UsuarioPlataforma): Promise<void> {
    await this.db
      .insert(usuarioPlataformaTable)
      .values({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        papel: usuario.papel,
      })
      .onConflictDoUpdate({
        target: usuarioPlataformaTable.id,
        set: {
          nome: usuario.nome,
          email: usuario.email,
          papel: usuario.papel,
        },
      });
  }

  async buscarPorId(id: string): Promise<UsuarioPlataforma | null> {
    const row = await this.db.query.usuarioPlataforma.findFirst({
      where: eq(usuarioPlataformaTable.id, id),
    });
    return row ? toDomain(row) : null;
  }

  async buscarPorEmail(email: string): Promise<UsuarioPlataforma | null> {
    const normalizado = email.trim().toLowerCase();
    const row = await this.db.query.usuarioPlataforma.findFirst({
      where: eq(usuarioPlataformaTable.email, normalizado),
    });
    return row ? toDomain(row) : null;
  }
}

/**
 * Função auxiliar que converte um registro retornado do banco de dados (linha da tabela usuarioPlataforma)
 * para a entidade de domínio UsuarioPlataforma. Faz o casting do papel (string do banco) para o tipo PapelPlataforma
 * e utiliza o método de reconstituição da entidade, garantindo validade das invariantes de domínio.
 *
 * Utilizada internamente nos métodos buscarPorId e buscarPorEmail deste adapter para transformar o formato
 * persistido no banco no modelo de domínio utilizado pela camada application/domain.
 */
function toDomain(row: {
  id: string;
  nome: string;
  email: string;
  papel: string;
}): UsuarioPlataforma {
  const props: UsuarioPlataformaProps = {
    id: row.id,
    nome: row.nome,
    email: row.email,
    papel: row.papel as PapelPlataforma,
  };
  return UsuarioPlataforma.reconstituir(props);
}
