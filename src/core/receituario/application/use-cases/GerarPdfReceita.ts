import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";

import { ReceitaNaoEncontradaError } from "../../domain/errors";
import type { GeradorPdfPort } from "../ports/GeradorPdfPort";
import type { ReceitaRepositoryPort } from "../ports/ReceitaRepositoryPort";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";

export type GerarPdfReceitaInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
  receitaId: string;
};

/** Resultado do caso de uso — PDF sob demanda, sem blob persistido. */
export type ArquivoPdfReceita = {
  bytes: Uint8Array;
  nomeArquivo: string;
  contentType: "application/pdf";
};

/**
 * Regenera PDF a partir da receita + snapshot persistidos (spec 006).
 * Não consulta ports de clínica/profissional/paciente ao vivo.
 */
export class GerarPdfReceita {
  constructor(
    private readonly receitaRepo: ReceitaRepositoryPort,
    private readonly geradorPdf: GeradorPdfPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
  ) {}

  async executar(input: GerarPdfReceitaInput): Promise<ArquivoPdfReceita> {
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "gerar_pdf_receita");

    const receita = await this.receitaRepo.buscarPorId(
      input.clinicaId,
      input.receitaId,
    );
    if (!receita) {
      throw new ReceitaNaoEncontradaError(input.receitaId);
    }

    const bytes = await this.geradorPdf.gerar(receita);
    const data = receita.emitidaEm.toISOString().slice(0, 10);

    return {
      bytes,
      nomeArquivo: `receita-${receita.id.slice(0, 8)}-${data}.pdf`,
      contentType: "application/pdf",
    };
  }
}
