import { randomUUID } from "node:crypto";

import { Assinatura } from "../../domain/Assinatura";
import { AssinaturaJaExisteError } from "../../domain/errors";
import type { AssinaturaRepositoryPort } from "../ports/AssinaturaRepositoryPort";

export type IniciarTrialInput = {
  clinicaId: string;
  /** Opcional — default `new Date()` no domínio. */
  dataInicio?: Date;
};

/**
 * Cria assinatura em `trialing` por 14 dias (spec 010).
 *
 * Orquestração: chamada por `src/actions` imediatamente após
 * `CriarClinicaComAdmin` — fora de `core/auth` e sem RBAC de clínica.
 *
 * Assinatura: `IniciarTrial(clinicaId) → Assinatura`
 */
export class IniciarTrial {
  constructor(private readonly assinaturaRepo: AssinaturaRepositoryPort) {}

  async executar(input: IniciarTrialInput): Promise<Assinatura> {
    const existente = await this.assinaturaRepo.buscarPorClinicaId(
      input.clinicaId,
    );
    if (existente) {
      throw new AssinaturaJaExisteError(input.clinicaId);
    }

    const assinatura = Assinatura.iniciarTrial({
      id: randomUUID(),
      clinicaId: input.clinicaId,
      dataInicio: input.dataInicio,
    });
    await this.assinaturaRepo.salvar(assinatura);
    return assinatura;
  }
}
