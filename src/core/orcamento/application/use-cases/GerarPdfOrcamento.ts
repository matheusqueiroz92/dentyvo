import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";
import type { GeradorPdfPort } from "@/core/receituario/application/ports/GeradorPdfPort";

import { OrcamentoNaoEncontradoError } from "../../domain/errors";
import type { OrcamentoRepositoryPort } from "../ports/OrcamentoRepositoryPort";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";

export type GerarPdfOrcamentoInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
  orcamentoId: string;
};

/** Resultado do caso de uso — PDF sob demanda, sem blob persistido. */
export type ArquivoPdfOrcamento = {
  bytes: Uint8Array;
  nomeArquivo: string;
  contentType: "application/pdf";
};

/**
 * Regenera PDF a partir do orçamento + snapshot persistidos (spec 015).
 */
export class GerarPdfOrcamento {
  constructor(
    private readonly orcamentoRepo: OrcamentoRepositoryPort,
    private readonly geradorPdf: GeradorPdfPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
  ) {}

  async executar(input: GerarPdfOrcamentoInput): Promise<ArquivoPdfOrcamento> {
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "gerar_pdf_orcamento");

    const orcamento = await this.orcamentoRepo.buscarPorId(
      input.clinicaId,
      input.orcamentoId,
    );
    if (!orcamento) {
      throw new OrcamentoNaoEncontradoError(input.orcamentoId);
    }

    const bytes = await this.geradorPdf.gerarOrcamento(orcamento);
    const data = orcamento.emitidoEm.toISOString().slice(0, 10);

    return {
      bytes,
      nomeArquivo: `orcamento-${orcamento.id.slice(0, 8)}-${data}.pdf`,
      contentType: "application/pdf",
    };
  }
}
