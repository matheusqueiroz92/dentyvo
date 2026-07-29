import type { Notificacao } from "@/core/notificacao/domain";

import {
  AssinaturaNaoEncontradaError,
  PlanoNaoEncontradoError,
} from "../../domain/errors";
import {
  assinaturaPendenteDeAvisoAumentoPreco,
  chaveNegocioAvisoAumentoPreco,
  jaEnviouAvisoAumentoPreco,
} from "../../domain/avisoAumentoPreco";
import { valorMensalPlanoEmCentavos } from "../../domain/elegibilidadePromocional";
import type { AssinaturaRepositoryPort } from "../ports/AssinaturaRepositoryPort";
import type { EnviarNotificacaoPort } from "../ports/EnviarNotificacaoPort";
import type { PlanoRepositoryPort } from "../ports/PlanoRepositoryPort";

export type EnviarAvisoAumentoPrecoInput = {
  assinaturaId: string;
  destinatarioUsuarioId: string;
  notificacaoId: string;
  agora?: Date;
};

export type EnviarAvisoAumentoPrecoResultado =
  | { status: "enviada"; notificacao: Notificacao }
  | { status: "noop"; motivo: "ja_enviado" | "fora_da_janela" | "sem_promocao" };

/**
 * Aviso pré-migração de preço via `EnviarNotificacao` (011) — spec 012, D7.
 */
export class EnviarAvisoAumentoPreco {
  constructor(
    private readonly assinaturaRepo: AssinaturaRepositoryPort,
    private readonly planoRepo: PlanoRepositoryPort,
    private readonly enviarNotificacao: EnviarNotificacaoPort,
  ) {}

  async executar(
    input: EnviarAvisoAumentoPrecoInput,
  ): Promise<EnviarAvisoAumentoPrecoResultado> {
    const agora = input.agora ?? new Date();
    const assinatura = await this.assinaturaRepo.buscarPorId(input.assinaturaId);
    if (!assinatura) {
      throw new AssinaturaNaoEncontradaError(input.assinaturaId);
    }

    if (!assinatura.temCopiaPromocional() || assinatura.precoPromocionalAte == null) {
      return { status: "noop", motivo: "sem_promocao" };
    }

    // Camada 1 (D7): checar flag ANTES de chamar 011
    if (jaEnviouAvisoAumentoPreco(assinatura)) {
      return { status: "noop", motivo: "ja_enviado" };
    }

    if (!assinaturaPendenteDeAvisoAumentoPreco(assinatura, agora)) {
      return { status: "noop", motivo: "fora_da_janela" };
    }

    const plano = assinatura.planoId
      ? await this.planoRepo.buscarPorId(assinatura.planoId)
      : null;
    if (assinatura.planoId && !plano) {
      throw new PlanoNaoEncontradoError(assinatura.planoId);
    }

    const chaveNegocio = chaveNegocioAvisoAumentoPreco(
      assinatura.id,
      assinatura.precoPromocionalAte,
    );

    const valorCheioCentavos = plano
      ? valorMensalPlanoEmCentavos(plano)
      : undefined;

    const notificacao = await this.enviarNotificacao.executar({
      id: input.notificacaoId,
      destinatario: {
        kind: "usuario",
        usuarioId: input.destinatarioUsuarioId,
      },
      tipo: "aviso_aumento_preco",
      canais: ["email", "in_app"],
      chaveNegocio,
      clinicaId: assinatura.clinicaId,
      agora,
      conteudo: {
        titulo: "Aumento de preço após promoção",
        mensagem:
          "O valor promocional da sua assinatura Dentyvo termina em breve. O preço cheio do plano passará a valer automaticamente.",
        assinaturaId: assinatura.id,
        planoId: assinatura.planoId ?? undefined,
        planoNome: plano?.nome,
        dataReferenciaIso: assinatura.precoPromocionalAte.toISOString(),
        valorCentavos: valorCheioCentavos,
      },
    });

    const marcada = assinatura.marcarAvisoAumentoPrecoEnviado(agora);
    await this.assinaturaRepo.salvar(marcada);

    return { status: "enviada", notificacao };
  }
}
