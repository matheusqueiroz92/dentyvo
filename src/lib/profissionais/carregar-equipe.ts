import { inArray } from "drizzle-orm";

import { ListarMembrosDaClinica } from "@/core/auth/application/use-cases";
import type { ContextoSessao } from "@/core/auth/domain/ContextoSessao";
import { createAuthModule } from "@/core/auth/infra/create-auth-module";
import { db } from "@/db";
import { user as userTable } from "@/db/schema";
import { requireSessaoClinica } from "@/lib/dashboard/obter-sessao-clinica";

import { conviteParaDto, membroParaDto } from "./mapear";
import type { LinhaEquipeDTO } from "./types";

export type EquipeInicial = {
  linhas: LinhaEquipeDTO[];
  papel: string;
  profissionalId: string;
};

export async function emailsPorUsuarioIds(
  usuarioIds: string[],
): Promise<Map<string, string>> {
  if (usuarioIds.length === 0) return new Map();
  const rows = await db
    .select({ id: userTable.id, email: userTable.email })
    .from(userTable)
    .where(inArray(userTable.id, usuarioIds));
  return new Map(rows.map((r) => [r.id, r.email]));
}

export async function montarListaEquipe(
  sessao: ContextoSessao,
): Promise<EquipeInicial> {
  const auth = createAuthModule();
  const membros = await new ListarMembrosDaClinica(
    auth.profissionalRepo,
    auth.authPort,
  ).executar({
    clinicaId: sessao.clinicaId,
    solicitadoPorUsuarioId: sessao.usuarioId,
  });

  const usuarioIds = membros.map((m) => m.usuarioId);
  const emailPorId = await emailsPorUsuarioIds(usuarioIds);

  const convites = await auth.conviteRepo.listarPendentesPorClinica(
    sessao.clinicaId,
  );

  return {
    linhas: [
      ...convites.map((c) => conviteParaDto(c)),
      ...membros.map((m) =>
        membroParaDto(m, emailPorId.get(m.usuarioId) ?? ""),
      ),
    ],
    papel: sessao.papel,
    profissionalId: sessao.profissionalId,
  };
}

export async function carregarEquipeInicial(): Promise<EquipeInicial> {
  const sessao = await requireSessaoClinica();
  return montarListaEquipe(sessao);
}
