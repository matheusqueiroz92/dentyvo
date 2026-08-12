import { randomUUID } from "node:crypto";

import type { ProcedimentoRepositoryPort } from "@/core/agendamento/application/ports/ProcedimentoRepositoryPort";
import { ProcedimentoNaoEncontradoError } from "@/core/agendamento/domain/errors";
import type { ClinicaRepositoryPort } from "@/core/auth/application/ports/ClinicaRepositoryPort";
import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";
import type { PacienteRepositoryPort } from "@/core/paciente/application/ports/PacienteRepositoryPort";
import type { ProntuarioRepositoryPort } from "@/core/prontuario/application/ports/ProntuarioRepositoryPort";
import { ProntuarioNaoEncontradoError } from "@/core/prontuario/domain/errors";
import { DadosInvalidosError } from "@/core/shared/errors";

import { ItemOrcamento } from "../../domain/ItemOrcamento";
import { Orcamento } from "../../domain/Orcamento";
import { OrcamentoSemItensError } from "../../domain/errors";
import type { OrcamentoRepositoryPort } from "../ports/OrcamentoRepositoryPort";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";

/**
 * Input de negócio: sem `profissionalId` e sem `nome` do item
 * (nome vem do snapshot do `Procedimento` na emissão).
 * Delivery mapeia sessão → `clinicaId` + `solicitadoPorUsuarioId`.
 *
 * `valor` opcional: se omitido, usa `Procedimento.valor` como sugestão.
 * `quantidade` opcional: default 1.
 * `validoAte` opcional: informativo; não altera status.
 */
export type EmitirOrcamentoInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
  prontuarioId: string;
  itens: Array<{
    procedimentoId: string;
    valor?: number;
    quantidade?: number;
  }>;
  validoAte?: Date | null;
};

/**
 * Emite orçamento comercial com status inicial `enviado` (spec 015).
 */
export class EmitirOrcamento {
  constructor(
    private readonly orcamentoRepo: OrcamentoRepositoryPort,
    private readonly prontuarioRepo: ProntuarioRepositoryPort,
    private readonly clinicaRepo: ClinicaRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
    private readonly pacienteRepo: PacienteRepositoryPort,
    private readonly procedimentoRepo: ProcedimentoRepositoryPort,
  ) {}

  async executar(input: EmitirOrcamentoInput): Promise<Orcamento> {
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "emitir_orcamento");

    if (!input.itens || input.itens.length === 0) {
      throw new OrcamentoSemItensError();
    }

    const prontuario = await this.prontuarioRepo.buscarPorId(
      input.clinicaId,
      input.prontuarioId,
    );
    if (!prontuario) {
      throw new ProntuarioNaoEncontradoError(input.prontuarioId);
    }

    const clinica = await this.clinicaRepo.buscarPorId(input.clinicaId);
    if (!clinica) {
      throw new DadosInvalidosError("Clínica da sessão não encontrada.");
    }

    const paciente = await this.pacienteRepo.buscarPorId(
      input.clinicaId,
      prontuario.pacienteId,
    );
    if (!paciente) {
      throw new DadosInvalidosError("Paciente do prontuário não encontrado.");
    }

    if (!solicitante.cro) {
      throw new DadosInvalidosError(
        "CRO do profissional é obrigatório para o snapshot do orçamento.",
      );
    }

    const itens: ItemOrcamento[] = [];
    for (const itemInput of input.itens) {
      const procedimento = await this.procedimentoRepo.buscarPorId(
        input.clinicaId,
        itemInput.procedimentoId,
      );
      if (!procedimento) {
        throw new ProcedimentoNaoEncontradoError(itemInput.procedimentoId);
      }

      itens.push(
        ItemOrcamento.criar({
          procedimentoId: procedimento.id,
          nome: procedimento.nome,
          valor:
            itemInput.valor !== undefined
              ? itemInput.valor
              : procedimento.valor,
          quantidade: itemInput.quantidade,
        }),
      );
    }

    const orcamento = Orcamento.emitir({
      id: randomUUID(),
      clinicaId: input.clinicaId,
      prontuarioId: prontuario.id,
      profissionalId: solicitante.id,
      itens,
      validoAte: input.validoAte,
      cabecalho: {
        clinicaNome: clinica.nome,
        clinicaEndereco: clinica.endereco,
        profissionalNome: solicitante.nome,
        profissionalCro: solicitante.cro,
        pacienteNome: paciente.nome,
        pacienteCpf: paciente.cpf.valor,
        pacienteDataNascimento: paciente.dataNascimento,
        profissionalEspecialidade: solicitante.especialidade,
      },
    });

    await this.orcamentoRepo.salvar(orcamento);
    return orcamento;
  }
}
