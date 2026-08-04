import { describe, expect, it } from "vitest";

import { DadosInvalidosError } from "@/core/shared/errors";

import { ContextoAgendamentoPublico } from "../../domain/ContextoAgendamentoPublico";
import { Procedimento } from "../../domain/Procedimento";
import {
  AcessoClinicaInativoParaLinkPublicoError,
  ProcedimentoNaoEncontradoError,
  ProfissionalNaoEncontradoPorSlugError,
  SobreposicaoHorarioError,
} from "../../domain/errors";
import {
  CPF_PACIENTE_NOVO,
  CPF_PACIENTE_PUBLICO,
  seedContextoLinkPublico,
  seedPacienteExistente,
  SLUG_CLINICA,
  SLUG_PROFISSIONAL,
} from "./helpers-test-link-publico";
import { MarcarConsultaViaLinkPublico } from "./MarcarConsultaViaLinkPublico";
import { segundaAs } from "./helpers-test";

const DATA_NASCIMENTO = new Date("1995-05-15T12:00:00.000Z");

function sut(ctx: Awaited<ReturnType<typeof seedContextoLinkPublico>>) {
  return new MarcarConsultaViaLinkPublico(
    ctx.marcarCore,
    ctx.pacienteRepo,
    ctx.profissionalRepo,
    ctx.procedimentoRepo,
    ctx.menuRepo,
    ctx.verificarAcessoAtivo,
  );
}

function contexto(
  ctx: Awaited<ReturnType<typeof seedContextoLinkPublico>>,
  profissionalSlug?: string,
) {
  return ContextoAgendamentoPublico.criar({
    clinicaId: ctx.clinicaId,
    slug: SLUG_CLINICA,
    profissionalSlug,
  });
}

describe("MarcarConsultaViaLinkPublico", () => {
  it("cria agendamento pendente com origem link-publico via núcleo compartilhado", async () => {
    const ctx = await seedContextoLinkPublico({ comMenuConfigurado: true });
    const agendamento = await sut(ctx).executar({
      contexto: contexto(ctx),
      nome: "Maria Nova",
      telefone: "77999991111",
      cpf: CPF_PACIENTE_NOVO,
      dataNascimento: DATA_NASCIMENTO,
      procedimentoId: ctx.procedimentoConsulta.id,
      profissionalId: ctx.dentista.id,
      dataHoraInicio: segundaAs(9),
      aceiteComunicacaoLembretes: true,
    });

    expect(agendamento.status).toBe("pendente");
    expect(agendamento.origem).toBe("link-publico");
    expect(agendamento.clinicaId).toBe(ctx.clinicaId);
    expect(
      await ctx.agendamentoRepo.buscarPorId(ctx.clinicaId, agendamento.id),
    ).not.toBeNull();
  });

  it("casa por CPF existente e NÃO atualiza nome/telefone do cadastro", async () => {
    const ctx = await seedContextoLinkPublico({ comMenuConfigurado: true });
    const existente = await seedPacienteExistente(ctx, {
      nome: "Nome Oficial",
      telefone: "77988887777",
      cpf: CPF_PACIENTE_PUBLICO,
    });

    const agendamento = await sut(ctx).executar({
      contexto: contexto(ctx),
      nome: "Nome Digitado No Form",
      telefone: "77900000000",
      cpf: CPF_PACIENTE_PUBLICO,
      dataNascimento: DATA_NASCIMENTO,
      procedimentoId: ctx.procedimentoConsulta.id,
      profissionalId: ctx.dentista.id,
      dataHoraInicio: segundaAs(9),
      aceiteComunicacaoLembretes: true,
    });

    expect(agendamento.pacienteId).toBe(existente.id);
    const persistido = await ctx.pacienteRepo.buscarPorId(
      ctx.clinicaId,
      existente.id,
    );
    expect(persistido?.nome).toBe("Nome Oficial");
    expect(persistido?.telefone).toBe("77988887777");
  });

  it("cria paciente novo quando CPF não existe no tenant", async () => {
    const ctx = await seedContextoLinkPublico({ comMenuConfigurado: true });
    const antes = await ctx.pacienteRepo.listarPorClinica(ctx.clinicaId);

    const agendamento = await sut(ctx).executar({
      contexto: contexto(ctx),
      nome: "Paciente Novo",
      telefone: "77912345678",
      cpf: CPF_PACIENTE_NOVO,
      dataNascimento: DATA_NASCIMENTO,
      procedimentoId: ctx.procedimentoConsulta.id,
      profissionalId: ctx.dentista.id,
      dataHoraInicio: segundaAs(10),
      aceiteComunicacaoLembretes: true,
    });

    const depois = await ctx.pacienteRepo.listarPorClinica(ctx.clinicaId);
    expect(depois.length).toBe(antes.length + 1);
    const criado = await ctx.pacienteRepo.buscarPorId(
      ctx.clinicaId,
      agendamento.pacienteId,
    );
    expect(criado?.nome).toBe("Paciente Novo");
    expect(criado?.cpf.valor).toBe(CPF_PACIENTE_NOVO);
  });

  it("persiste dataNascimento ao criar paciente novo via link público", async () => {
    const ctx = await seedContextoLinkPublico({ comMenuConfigurado: true });

    const agendamento = await sut(ctx).executar({
      contexto: contexto(ctx),
      nome: "Com Data Nascimento",
      telefone: "77912345678",
      cpf: CPF_PACIENTE_NOVO,
      dataNascimento: DATA_NASCIMENTO,
      procedimentoId: ctx.procedimentoConsulta.id,
      profissionalId: ctx.dentista.id,
      dataHoraInicio: segundaAs(10),
      aceiteComunicacaoLembretes: true,
    });

    const criado = await ctx.pacienteRepo.buscarPorId(
      ctx.clinicaId,
      agendamento.pacienteId,
    );
    expect(criado?.dataNascimento.toISOString()).toBe(
      DATA_NASCIMENTO.toISOString(),
    );
  });

  it("NÃO altera dataNascimento de paciente existente quando o form envia outra data", async () => {
    const ctx = await seedContextoLinkPublico({ comMenuConfigurado: true });
    const dataOficial = new Date("1990-01-01T12:00:00.000Z");
    const existente = await seedPacienteExistente(ctx, {
      cpf: CPF_PACIENTE_PUBLICO,
    });
    expect(existente.dataNascimento.toISOString()).toBe(
      dataOficial.toISOString(),
    );

    await sut(ctx).executar({
      contexto: contexto(ctx),
      nome: "Nome Digitado",
      telefone: "77900000000",
      cpf: CPF_PACIENTE_PUBLICO,
      dataNascimento: new Date("2000-12-31T12:00:00.000Z"),
      procedimentoId: ctx.procedimentoConsulta.id,
      profissionalId: ctx.dentista.id,
      dataHoraInicio: segundaAs(11),
      aceiteComunicacaoLembretes: true,
    });

    const persistido = await ctx.pacienteRepo.buscarPorId(
      ctx.clinicaId,
      existente.id,
    );
    expect(persistido?.dataNascimento.toISOString()).toBe(
      dataOficial.toISOString(),
    );
  });

  it("exige aceite de comunicacao_lembretes (marketing nunca implícito)", async () => {
    const ctx = await seedContextoLinkPublico({ comMenuConfigurado: true });
    await expect(
      sut(ctx).executar({
        contexto: contexto(ctx),
        nome: "Sem Aceite",
        telefone: "77911112222",
        cpf: CPF_PACIENTE_NOVO,
        dataNascimento: DATA_NASCIMENTO,
        procedimentoId: ctx.procedimentoConsulta.id,
        profissionalId: ctx.dentista.id,
        dataHoraInicio: segundaAs(9),
        aceiteComunicacaoLembretes: false,
      }),
    ).rejects.toBeInstanceOf(DadosInvalidosError);
  });

  it("rejeita procedimento fora do menu público efetivo", async () => {
    const ctx = await seedContextoLinkPublico({ comMenuConfigurado: true });
    await ctx.procedimentoRepo.salvar(
      Procedimento.criar({
        id: "proc-fora",
        clinicaId: ctx.clinicaId,
        nome: "Clareamento",
        duracaoPadraoMinutos: 60,
        valor: 500,
      }),
    );

    await expect(
      sut(ctx).executar({
        contexto: contexto(ctx),
        nome: "Maria",
        telefone: "77999991111",
        cpf: CPF_PACIENTE_NOVO,
        dataNascimento: DATA_NASCIMENTO,
        procedimentoId: "proc-fora",
        profissionalId: ctx.dentista.id,
        dataHoraInicio: segundaAs(9),
        aceiteComunicacaoLembretes: true,
      }),
    ).rejects.toBeInstanceOf(ProcedimentoNaoEncontradoError);
  });

  it("com profissional pré-resolvido, rejeita profissionalId diferente", async () => {
    const ctx = await seedContextoLinkPublico({ comMenuConfigurado: true });
    await expect(
      sut(ctx).executar({
        contexto: contexto(ctx, SLUG_PROFISSIONAL),
        nome: "Maria",
        telefone: "77999991111",
        cpf: CPF_PACIENTE_NOVO,
        dataNascimento: DATA_NASCIMENTO,
        procedimentoId: ctx.procedimentoConsulta.id,
        profissionalId: ctx.admin.id,
        dataHoraInicio: segundaAs(9),
        aceiteComunicacaoLembretes: true,
      }),
    ).rejects.toBeInstanceOf(ProfissionalNaoEncontradoPorSlugError);
  });

  it("bloqueia overbooking pelo mesmo núcleo (sem duplicar regra)", async () => {
    const ctx = await seedContextoLinkPublico({ comMenuConfigurado: true });
    const marcar = sut(ctx);
    await marcar.executar({
      contexto: contexto(ctx),
      nome: "Primeiro",
      telefone: "77911111111",
      cpf: CPF_PACIENTE_PUBLICO,
      dataNascimento: DATA_NASCIMENTO,
      procedimentoId: ctx.procedimentoConsulta.id,
      profissionalId: ctx.dentista.id,
      dataHoraInicio: segundaAs(9),
      aceiteComunicacaoLembretes: true,
    });

    await expect(
      marcar.executar({
        contexto: contexto(ctx),
        nome: "Segundo",
        telefone: "77922222222",
        cpf: CPF_PACIENTE_NOVO,
        dataNascimento: DATA_NASCIMENTO,
        procedimentoId: ctx.procedimentoConsulta.id,
        profissionalId: ctx.dentista.id,
        dataHoraInicio: segundaAs(9),
        aceiteComunicacaoLembretes: true,
      }),
    ).rejects.toBeInstanceOf(SobreposicaoHorarioError);
  });

  it("falha quando o acesso da clínica não está ativo", async () => {
    const ctx = await seedContextoLinkPublico({
      comAssinaturaAtiva: false,
      comMenuConfigurado: true,
    });
    await expect(
      sut(ctx).executar({
        contexto: contexto(ctx),
        nome: "Maria",
        telefone: "77999991111",
        cpf: CPF_PACIENTE_NOVO,
        dataNascimento: DATA_NASCIMENTO,
        procedimentoId: ctx.procedimentoConsulta.id,
        profissionalId: ctx.dentista.id,
        dataHoraInicio: segundaAs(9),
        aceiteComunicacaoLembretes: true,
      }),
    ).rejects.toBeInstanceOf(AcessoClinicaInativoParaLinkPublicoError);
  });
});
