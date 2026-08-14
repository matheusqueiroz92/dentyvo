"use server";

import { ObterContextoSessao } from "@/core/auth/application/use-cases";
import { createAuthModule } from "@/core/auth/infra/create-auth-module";
import {
  ObterDetalhesAssinatura,
  ResolverValorCobrancaAssinatura,
} from "@/core/assinatura/application/use-cases";
import {
  DrizzleAssinaturaRepository,
  DrizzleCobrancaRepository,
  DrizzlePlanoRepository,
  DrizzleVagaPromocionalRepository,
} from "@/core/assinatura/infra/adapters";
import { db } from "@/db";
import { detalhesAssinaturaParaDto } from "@/lib/configuracoes/mapear-assinatura";
import type { DetalhesAssinaturaDTO } from "@/lib/configuracoes/assinatura-types";
import { actionClient } from "@/lib/safe-action";

export const obterDetalhesAssinaturaAction = actionClient.action(
  async (): Promise<{ papel: string; detalhes: DetalhesAssinaturaDTO }> => {
    const auth = createAuthModule();
    const ctx = await new ObterContextoSessao(auth.authPort).executar();
    if (!ctx) {
      throw new Error("Sessão expirada. Faça login novamente.");
    }

    const assinaturaRepo = new DrizzleAssinaturaRepository(db);
    const planoRepo = new DrizzlePlanoRepository(db);
    const uc = new ObterDetalhesAssinatura(
      assinaturaRepo,
      planoRepo,
      new DrizzleCobrancaRepository(db),
      new DrizzleVagaPromocionalRepository(db),
      auth.profissionalRepo,
      new ResolverValorCobrancaAssinatura(assinaturaRepo, planoRepo),
    );

    const detalhes = await uc.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.usuarioId,
    });

    return {
      papel: ctx.papel,
      detalhes: detalhesAssinaturaParaDto(detalhes),
    };
  },
);
