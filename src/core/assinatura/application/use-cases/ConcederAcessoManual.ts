import type { UsuarioPlataformaRepositoryPort } from "@/core/admin-plataforma/application/ports/UsuarioPlataformaRepositoryPort";
import type { AuditoriaLogPort } from "@/core/prontuario/application/ports/AuditoriaLogPort";

import { AssinaturaNaoEncontradaError } from "../../domain/errors";
import type { AssinaturaRepositoryPort } from "../ports/AssinaturaRepositoryPort";
import {
  autorizarConcessaoManual,
  obterSolicitantePlataforma,
  registrarAuditoriaConcessaoManual,
} from "./helpers";

export type ConcederAcessoManualInput = {
  solicitadoPorUsuarioPlataformaId: string;
  clinicaId: string;
  motivo: string;
  ateData: Date;
};

/**
 * Override de cortesia/negociação pelo super-admin (spec 010, opção A):
 * grava `acessoManualAte` + motivo **sem** sobrescrever status real de
 * cobrança/`Assinatura`. Audita via `AuditoriaLogPort` (003).
 *
 * Assinatura: `ConcederAcessoManual(clinicaId, motivo, ateData) → void`
 */
export class ConcederAcessoManual {
  constructor(
    private readonly assinaturaRepo: AssinaturaRepositoryPort,
    private readonly usuarioPlataformaRepo: UsuarioPlataformaRepositoryPort,
    private readonly auditoria: AuditoriaLogPort,
  ) {}

  async executar(input: ConcederAcessoManualInput): Promise<void> {
    const solicitante = await obterSolicitantePlataforma(
      this.usuarioPlataformaRepo,
      input.solicitadoPorUsuarioPlataformaId,
    );
    autorizarConcessaoManual(solicitante);

    const assinatura = await this.assinaturaRepo.buscarPorClinicaId(
      input.clinicaId,
    );
    if (!assinatura) {
      throw new AssinaturaNaoEncontradaError(input.clinicaId);
    }

    const atualizada = assinatura.concederAcessoManual({
      motivo: input.motivo,
      ateData: input.ateData,
    });
    await this.assinaturaRepo.salvar(atualizada);

    await registrarAuditoriaConcessaoManual({
      auditoria: this.auditoria,
      solicitante,
      clinicaId: input.clinicaId,
      assinaturaId: atualizada.id,
      motivo: input.motivo.trim(),
    });
  }
}
