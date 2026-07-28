import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import type { AuthPort, UsuarioAuth } from "../../application/ports/AuthPort";
import type { ProfissionalRepositoryPort } from "../../application/ports/ProfissionalRepositoryPort";
import type { ContextoSessao } from "../../domain/ContextoSessao";
import type { db as Db } from "@/db";
import { session as sessionTable, user as userTable } from "@/db/schema";
import { auth } from "@/lib/auth";

type Database = typeof Db;

/**
 * Adapter BetterAuth + lookup de Profissional para montar o contexto multi-tenant.
 */
export class BetterAuthAuthPort implements AuthPort {
  constructor(
    private readonly db: Database,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
    private readonly resolveHeaders: () => Promise<Headers> | Headers = () =>
      headers(),
  ) {}

  async criarUsuario(input: {
    nome: string;
    email: string;
    senha: string;
  }): Promise<UsuarioAuth> {
    const result = await auth.api.signUpEmail({
      body: {
        name: input.nome,
        email: input.email.trim().toLowerCase(),
        password: input.senha,
      },
    });

    return {
      id: result.user.id,
      email: result.user.email,
      nome: result.user.name,
    };
  }

  async buscarUsuarioPorEmail(email: string): Promise<UsuarioAuth | null> {
    const normalizado = email.trim().toLowerCase();
    const row = await this.db.query.user.findFirst({
      where: eq(userTable.email, normalizado),
    });
    if (!row) return null;
    return { id: row.id, email: row.email, nome: row.name };
  }

  async obterContextoSessao(): Promise<ContextoSessao | null> {
    const requestHeaders = await this.resolveHeaders();
    const sessao = await auth.api.getSession({ headers: requestHeaders });
    if (!sessao?.user) return null;

    const profissional = await this.profissionalRepo.buscarPorUsuarioId(
      sessao.user.id,
    );
    if (!profissional) return null;

    return {
      usuarioId: sessao.user.id,
      clinicaId: profissional.clinicaId,
      papel: profissional.papel,
      profissionalId: profissional.id,
    };
  }

  async revogarSessoesDoUsuario(usuarioId: string): Promise<void> {
    await this.db
      .delete(sessionTable)
      .where(eq(sessionTable.userId, usuarioId));
  }
}
