import { randomUUID } from "node:crypto";

import type { ClinicaRepositoryPort } from "@/core/auth/application/ports/ClinicaRepositoryPort";
import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";
import type { PacienteRepositoryPort } from "@/core/paciente/application/ports/PacienteRepositoryPort";
import type { ProntuarioRepositoryPort } from "@/core/prontuario/application/ports/ProntuarioRepositoryPort";
import { ProntuarioNaoEncontradoError } from "@/core/prontuario/domain/errors";
import { DadosInvalidosError } from "@/core/shared/errors";

import { CroAusenteNaEmissaoError } from "../../domain/errors";
import type { ItemReceitaProps } from "../../domain/ItemReceita";
import { Receita } from "../../domain/Receita";
import type { ReceitaRepositoryPort } from "../ports/ReceitaRepositoryPort";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";

/**
 * Input de negócio: sem `profissionalId`.
 * Delivery mapeia `ContextoSessao` → `clinicaId` + `solicitadoPorUsuarioId`;
 * o caso de uso usa `solicitante.id` como `profissionalId` da emissão.
 */
export type EmitirReceitaInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
  prontuarioId: string;
  itens: ItemReceitaProps[];
};

/**
 * Emite receita imutável com snapshot de cabeçalho (spec 006).
 */
export class EmitirReceita {
  constructor(
    private readonly receitaRepo: ReceitaRepositoryPort,
    private readonly prontuarioRepo: ProntuarioRepositoryPort,
    private readonly clinicaRepo: ClinicaRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
    private readonly pacienteRepo: PacienteRepositoryPort,
  ) {}

  async executar(input: EmitirReceitaInput): Promise<Receita> {
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "emitir_receita");

    if (!solicitante.cro) {
      throw new CroAusenteNaEmissaoError();
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

    const receita = Receita.emitir({
      id: randomUUID(),
      clinicaId: input.clinicaId,
      prontuarioId: prontuario.id,
      profissionalId: solicitante.id,
      itens: input.itens,
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

    await this.receitaRepo.salvar(receita);
    return receita;
  }
}
