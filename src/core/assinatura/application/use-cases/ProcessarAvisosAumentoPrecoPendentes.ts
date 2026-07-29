import { randomUUID } from "node:crypto";

import { ANTECEDENCIA_AVISO_AUMENTO_PRECO_DIAS } from "../../domain/constants";
import type { AssinaturaRepositoryPort } from "../ports/AssinaturaRepositoryPort";
import type { EnviarAvisoAumentoPreco } from "./EnviarAvisoAumentoPreco";

export type ProcessarAvisosAumentoPrecoPendentesInput = {
  agora?: Date;
  limite?: number;
  /**
   * Destinatário padrão quando o job não resolve o admin da clínica.
   * Em produção o cron deve passar o resolver real (ver TODO no módulo).
   */
  destinatarioUsuarioIdFallback?: string;
};

export type ProcessarAvisosAumentoPrecoPendentesResultado = {
  processados: number;
  enviados: number;
  noop: number;
};

/**
 * Job em lote: lista candidatas e chama `EnviarAvisoAumentoPreco` (spec 012).
 *
 * TODO (agendamento): registrar este caso de uso em **Vercel Cron**
 * (`vercel.json` → `crons`), protegido por segredo de cron — mesmo padrão
 * já decidido em `specs/01-architecture.md` para tarefas periódicas simples.
 * Não implementar o agendamento nesta etapa (só o caso de uso).
 */
export class ProcessarAvisosAumentoPrecoPendentes {
  constructor(
    private readonly assinaturaRepo: AssinaturaRepositoryPort,
    private readonly enviarAviso: EnviarAvisoAumentoPreco,
  ) {}

  async executar(
    input: ProcessarAvisosAumentoPrecoPendentesInput = {},
  ): Promise<ProcessarAvisosAumentoPrecoPendentesResultado> {
    const agora = input.agora ?? new Date();
    const candidatas =
      await this.assinaturaRepo.listarComAvisoAumentoPrecoPendente({
        agora,
        antecedenciaDias: ANTECEDENCIA_AVISO_AUMENTO_PRECO_DIAS,
        limite: input.limite,
      });

    let enviados = 0;
    let noop = 0;

    for (const assinatura of candidatas) {
      const resultado = await this.enviarAviso.executar({
        assinaturaId: assinatura.id,
        destinatarioUsuarioId:
          input.destinatarioUsuarioIdFallback ??
          `job-aviso-preco:${assinatura.clinicaId}`,
        notificacaoId: randomUUID(),
        agora,
      });

      if (resultado.status === "enviada") {
        enviados += 1;
      } else {
        noop += 1;
      }
    }

    return {
      processados: candidatas.length,
      enviados,
      noop,
    };
  }
}
