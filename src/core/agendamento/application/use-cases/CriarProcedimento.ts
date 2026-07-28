import { randomUUID } from "node:crypto";

import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";

import { Procedimento } from "../../domain/Procedimento";
import type { ProcedimentoRepositoryPort } from "../ports/ProcedimentoRepositoryPort";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";

export type CriarProcedimentoInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
  nome: string;
  duracaoPadraoMinutos: number;
  valor: number;
};

export class CriarProcedimento {
  constructor(
    private readonly procedimentoRepo: ProcedimentoRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
  ) {}

  async executar(input: CriarProcedimentoInput): Promise<Procedimento> {
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "criar_procedimento");

    const procedimento = Procedimento.criar({
      id: randomUUID(),
      clinicaId: input.clinicaId,
      nome: input.nome,
      duracaoPadraoMinutos: input.duracaoPadraoMinutos,
      valor: input.valor,
    });
    await this.procedimentoRepo.salvar(procedimento);
    return procedimento;
  }
}
