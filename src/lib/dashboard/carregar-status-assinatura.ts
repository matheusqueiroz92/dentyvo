import { cache } from "react";

import { VerificarAcessoAtivo } from "@/core/assinatura/application/use-cases/VerificarAcessoAtivo";
import { DrizzleAssinaturaRepository } from "@/core/assinatura/infra/adapters";
import { db } from "@/db";

import { requireSessaoClinica } from "./obter-sessao-clinica";
import type {
  ResultadoBloco,
  StatusAssinaturaDashboardDTO,
} from "./types";

export const carregarStatusAssinatura = cache(
  async (): Promise<ResultadoBloco<StatusAssinaturaDashboardDTO>> => {
    const sessao = await requireSessaoClinica();

    try {
      const resultado = await new VerificarAcessoAtivo(
        new DrizzleAssinaturaRepository(db),
      ).executar({ clinicaId: sessao.clinicaId });

      return {
        ok: true,
        data: {
          permitido: resultado.permitido,
          motivo: resultado.motivo,
          ateDataIso: resultado.ateData?.toISOString() ?? null,
        },
      };
    } catch (error) {
      console.error("[dashboard] carregarStatusAssinatura", error);
      return {
        ok: false,
        mensagem:
          error instanceof Error
            ? error.message
            : "Não foi possível carregar o status da assinatura.",
      };
    }
  },
);
