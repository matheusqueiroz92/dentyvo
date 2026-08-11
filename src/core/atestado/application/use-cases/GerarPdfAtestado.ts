import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";
import type { GeradorPdfPort } from "@/core/receituario/application/ports/GeradorPdfPort";

import { AtestadoNaoEncontradoError } from "../../domain/errors";
import type { AtestadoRepositoryPort } from "../ports/AtestadoRepositoryPort";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";

export type GerarPdfAtestadoInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
  atestadoId: string;
};

/** Resultado do caso de uso — PDF sob demanda, sem blob persistido. */
export type ArquivoPdfAtestado = {
  bytes: Uint8Array;
  nomeArquivo: string;
  contentType: "application/pdf";
};

/**
 * Regenera PDF a partir do atestado + snapshot persistidos (spec 006b).
 * Não consulta ports de clínica/profissional/paciente ao vivo.
 */
export class GerarPdfAtestado {
  constructor(
    private readonly atestadoRepo: AtestadoRepositoryPort,
    private readonly geradorPdf: GeradorPdfPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
  ) {}

  async executar(input: GerarPdfAtestadoInput): Promise<ArquivoPdfAtestado> {
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "gerar_pdf_atestado");

    const atestado = await this.atestadoRepo.buscarPorId(
      input.clinicaId,
      input.atestadoId,
    );
    if (!atestado) {
      throw new AtestadoNaoEncontradoError(input.atestadoId);
    }

    const bytes = await this.geradorPdf.gerarAtestado(atestado);
    const data = atestado.emitidaEm.toISOString().slice(0, 10);

    return {
      bytes,
      nomeArquivo: `atestado-${atestado.id.slice(0, 8)}-${data}.pdf`,
      contentType: "application/pdf",
    };
  }
}
