import { randomUUID } from "node:crypto";

import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";
import type { VerificarAcessoAtivo } from "@/core/assinatura/application/use-cases/VerificarAcessoAtivo";
import type { PacienteRepositoryPort } from "@/core/paciente/application/ports/PacienteRepositoryPort";
import { Paciente } from "@/core/paciente/domain/Paciente";
import { DadosInvalidosError } from "@/core/shared/errors";

import type { Agendamento } from "../../domain/Agendamento";
import type { ContextoAgendamentoPublico } from "../../domain/ContextoAgendamentoPublico";
import {
  ROTULO_PROCEDIMENTO_CATCH_ALL,
} from "../../domain/MenuPublicoProcedimento";
import { Procedimento } from "../../domain/Procedimento";
import {
  AcessoClinicaInativoParaLinkPublicoError,
  ProcedimentoNaoEncontradoError,
  ProfissionalNaoEncontradoPorSlugError,
} from "../../domain/errors";
import type { MenuPublicoProcedimentoRepositoryPort } from "../ports/MenuPublicoProcedimentoRepositoryPort";
import type { ProcedimentoRepositoryPort } from "../ports/ProcedimentoRepositoryPort";
import { MarcarConsultaCore } from "./marcarConsultaCore";

export type MarcarConsultaViaLinkPublicoInput = {
  contexto: ContextoAgendamentoPublico;
  nome: string;
  telefone: string;
  cpf: string;
  /**
   * Necessário ao criar `Paciente` novo (`Paciente.criar` exige o campo).
   * Se CPF já existir no tenant, o valor informado é ignorado (sem sobrescrita).
   */
  dataNascimento: Date;
  procedimentoId: string;
  profissionalId: string;
  dataHoraInicio: Date;
  /** Aceite explícito de `comunicacao_lembretes` (marketing nunca implícito). */
  aceiteComunicacaoLembretes: boolean;
};

/**
 * Porta pública: valida acesso, resolve/cria paciente por CPF e delega ao
 * {@link MarcarConsultaCore} com `origem: "link-publico"`.
 */
export class MarcarConsultaViaLinkPublico {
  constructor(
    private readonly core: MarcarConsultaCore,
    private readonly pacienteRepo: PacienteRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
    private readonly procedimentoRepo: ProcedimentoRepositoryPort,
    private readonly menuRepo: MenuPublicoProcedimentoRepositoryPort,
    private readonly verificarAcessoAtivo: VerificarAcessoAtivo,
  ) {}

  async executar(
    input: MarcarConsultaViaLinkPublicoInput,
  ): Promise<Agendamento> {
    if (!input.aceiteComunicacaoLembretes) {
      throw new DadosInvalidosError(
        "É necessário aceitar a comunicação de lembretes para agendar pelo link público.",
      );
    }

    const acesso = await this.verificarAcessoAtivo.executar({
      clinicaId: input.contexto.clinicaId,
    });
    if (!acesso.permitido) {
      throw new AcessoClinicaInativoParaLinkPublicoError(
        input.contexto.clinicaId,
      );
    }

    await this.assertProfissionalDoContexto(
      input.contexto,
      input.profissionalId,
    );
    await this.assertProcedimentoNoMenu(
      input.contexto.clinicaId,
      input.procedimentoId,
    );

    const pacienteId = await this.resolverPaciente(input);

    return this.core.executar({
      clinicaId: input.contexto.clinicaId,
      pacienteId,
      profissionalId: input.profissionalId,
      procedimentoId: input.procedimentoId,
      dataHoraInicio: input.dataHoraInicio,
      origem: "link-publico",
    });
  }

  private async assertProfissionalDoContexto(
    contexto: ContextoAgendamentoPublico,
    profissionalId: string,
  ): Promise<void> {
    if (!contexto.profissionalSlug) {
      return;
    }
    const profissional = await this.profissionalRepo.buscarPorSlug(
      contexto.clinicaId,
      contexto.profissionalSlug,
    );
    if (!profissional || profissional.id !== profissionalId) {
      throw new ProfissionalNaoEncontradoPorSlugError(
        contexto.clinicaId,
        contexto.profissionalSlug,
      );
    }
  }

  private async assertProcedimentoNoMenu(
    clinicaId: string,
    procedimentoId: string,
  ): Promise<void> {
    const menu = await this.menuRepo.buscarPorClinicaId(clinicaId);
    if (menu.estaConfigurado) {
      if (!menu.contemProcedimento(procedimentoId)) {
        throw new ProcedimentoNaoEncontradoError(procedimentoId);
      }
      return;
    }

    const catchAllId = await this.garantirProcedimentoCatchAll(clinicaId);
    if (procedimentoId !== catchAllId) {
      throw new ProcedimentoNaoEncontradoError(procedimentoId);
    }
  }

  private async garantirProcedimentoCatchAll(
    clinicaId: string,
  ): Promise<string> {
    const existentes = await this.procedimentoRepo.listarPorClinica(clinicaId);
    const jaExiste = existentes.find(
      (p) => p.nome === ROTULO_PROCEDIMENTO_CATCH_ALL,
    );
    if (jaExiste) {
      return jaExiste.id;
    }

    const criado = Procedimento.criar({
      id: randomUUID(),
      clinicaId,
      nome: ROTULO_PROCEDIMENTO_CATCH_ALL,
      duracaoPadraoMinutos: 60,
      valor: 0,
    });
    await this.procedimentoRepo.salvar(criado);
    return criado.id;
  }

  private async resolverPaciente(
    input: MarcarConsultaViaLinkPublicoInput,
  ): Promise<string> {
    const existente = await this.pacienteRepo.buscarPorCpf(
      input.contexto.clinicaId,
      input.cpf,
    );
    if (existente) {
      // Não sobrescreve nome/telefone (spec — canal sem autenticação).
      return existente.id;
    }

    const novo = Paciente.criar({
      id: randomUUID(),
      clinicaId: input.contexto.clinicaId,
      nome: input.nome,
      cpf: input.cpf,
      telefone: input.telefone,
      dataNascimento: input.dataNascimento,
    });
    await this.pacienteRepo.salvar(novo);
    return novo.id;
  }
}
