import type { ResultadoAcesso } from "../../domain/ResultadoAcesso";
import type { AssinaturaRepositoryPort } from "../ports/AssinaturaRepositoryPort";

export type VerificarAcessoAtivoInput = {
  clinicaId: string;
  /** Default `new Date()`. */
  agora?: Date;
};

/**
 * Indica se a clínica pode executar **escrita** operacional.
 *
 * Integração como guard em `agendamento` / `prontuario` / `whatsapp-bot`
 * é etapa própria pós-010 — este módulo só expõe a assinatura do caso de uso.
 *
 * Assinatura: `VerificarAcessoAtivo(clinicaId) → ResultadoAcesso`
 */
export class VerificarAcessoAtivo {
  constructor(private readonly assinaturaRepo: AssinaturaRepositoryPort) {}

  async executar(
    input: VerificarAcessoAtivoInput,
  ): Promise<ResultadoAcesso> {
    const assinatura = await this.assinaturaRepo.buscarPorClinicaId(
      input.clinicaId,
    );
    if (!assinatura) {
      return { permitido: false, motivo: "sem_assinatura" };
    }
    return assinatura.avaliarAcesso(input.agora ?? new Date());
  }
}
