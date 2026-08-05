"use server";

import { z } from "zod";

import { ObterContextoSessao } from "@/core/auth/application/use-cases/ObterContextoSessao";
import { createAuthModule } from "@/core/auth/infra/create-auth-module";
import {
  AtualizarAnamnese,
  ListarVersoesAnamnese,
  ObterVersaoVigenteAnamnese,
  PreencherAnamnese,
} from "@/core/anamnese/application/use-cases";
import { createAnamneseModule } from "@/core/anamnese/infra/create-anamnese-module";
import {
  ConsultarProntuario,
  CriarProntuario,
  ObterEvolucoesDoProntuario,
  RegistrarEvolucao,
  RetificarEvolucao,
} from "@/core/prontuario/application/use-cases";
import { createProntuarioModule } from "@/core/prontuario/infra/create-prontuario-module";
import { ListarProcedimentos } from "@/core/agendamento/application/use-cases/ListarProcedimentos";
import { createAgendamentoModule } from "@/core/agendamento/infra/create-agendamento-module";
import {
  anamneseParaDto,
  evolucaoParaDto,
  prontuarioParaDto,
} from "@/lib/prontuario/mapear";
import {
  anamneseFormSchema,
  registrarEvolucaoFormSchema,
  retificarEvolucaoFormSchema,
} from "@/lib/prontuario/schema";
import type {
  AnamneseDTO,
  EvolucaoDTO,
  ProntuarioTabDTO,
} from "@/lib/prontuario/types";
import { actionClient } from "@/lib/safe-action";

async function exigirSessao() {
  const auth = createAuthModule();
  const ctx = await new ObterContextoSessao(auth.authPort).executar();
  if (!ctx) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }
  return ctx;
}

function respostasDoForm(values: z.infer<typeof anamneseFormSchema>) {
  const normalizar = (secao: { texto: string; negado: boolean }) => {
    if (secao.negado) {
      return { texto: null as string | null, negado: true };
    }
    const texto = secao.texto.trim();
    return { texto: texto || null, negado: false };
  };
  return {
    historicoMedico: normalizar(values.historicoMedico),
    alergias: normalizar(values.alergias),
    medicacoesEmUso: normalizar(values.medicacoesEmUso),
    condicoesPreexistentes: normalizar(values.condicoesPreexistentes),
  };
}

async function mapearVersoesComNomes(
  clinicaId: string,
  versoes: Awaited<ReturnType<ListarVersoesAnamnese["executar"]>>,
): Promise<AnamneseDTO[]> {
  const prontuarioMod = createProntuarioModule();
  const membros = await prontuarioMod.profissionalRepo.listarPorClinica(
    clinicaId,
  );
  const nomes = new Map(membros.map((m) => [m.id, m.nome]));

  return versoes
    .slice()
    .sort((a, b) => b.versao - a.versao)
    .map((v) =>
      anamneseParaDto(
        v,
        nomes.get(v.preenchidoPorProfissionalId) ?? "Profissional",
      ),
    );
}

async function mapearEvolucoesComNomes(
  clinicaId: string,
  evolucoes: Awaited<ReturnType<ObterEvolucoesDoProntuario["executar"]>>,
): Promise<EvolucaoDTO[]> {
  const prontuarioMod = createProntuarioModule();
  const agendamentoMod = createAgendamentoModule();

  const [membros, procedimentos] = await Promise.all([
    prontuarioMod.profissionalRepo.listarPorClinica(clinicaId),
    agendamentoMod.procedimentoRepo.listarPorClinica(clinicaId),
  ]);

  const nomesProf = new Map(membros.map((m) => [m.id, m.nome]));
  const nomesProc = new Map(procedimentos.map((p) => [p.id, p.nome]));
  const retificadas = new Set(
    evolucoes
      .filter((e) => e.tipo === "retificacao" && e.evolucaoRetificadaId)
      .map((e) => e.evolucaoRetificadaId as string),
  );

  return evolucoes.map((e) =>
    evolucaoParaDto(e, {
      profissionalNome: nomesProf.get(e.profissionalId) ?? "Profissional",
      procedimentoNome: e.procedimentoId
        ? (nomesProc.get(e.procedimentoId) ?? null)
        : null,
      jaRetificada: e.tipo === "registro" && retificadas.has(e.id),
    }),
  );
}

/**
 * Carrega a aba Prontuário.
 * Se o paciente já tiver prontuário, passa por `ConsultarProntuario`
 * (auditoria de leitura obrigatória — spec 003).
 */
export const carregarProntuarioTabAction = actionClient
  .inputSchema(z.object({ pacienteId: z.string().uuid() }))
  .action(async ({ parsedInput }): Promise<ProntuarioTabDTO> => {
    const sessao = await exigirSessao();
    const prontuarioMod = createProntuarioModule();
    const anamneseMod = createAnamneseModule();
    const agendamentoMod = createAgendamentoModule();

    const existente = await prontuarioMod.prontuarioRepo.buscarPorPacienteId(
      sessao.clinicaId,
      parsedInput.pacienteId,
    );

    if (!existente) {
      return { status: "sem_prontuario" };
    }

    // Critério de aceite: leitura via ConsultarProntuario (gera auditoria).
    const prontuario = await new ConsultarProntuario(
      prontuarioMod.prontuarioRepo,
      prontuarioMod.profissionalRepo,
      prontuarioMod.auditoria,
    ).executar({
      clinicaId: sessao.clinicaId,
      solicitadoPorUsuarioId: sessao.usuarioId,
      prontuarioId: existente.id,
    });

    const [vigente, versoes, evolucoes, procedimentos] = await Promise.all([
      new ObterVersaoVigenteAnamnese(
        anamneseMod.anamneseRepo,
        anamneseMod.prontuarioRepo,
        anamneseMod.profissionalRepo,
      ).executar({
        clinicaId: sessao.clinicaId,
        solicitadoPorUsuarioId: sessao.usuarioId,
        prontuarioId: prontuario.id,
      }),
      new ListarVersoesAnamnese(
        anamneseMod.anamneseRepo,
        anamneseMod.prontuarioRepo,
        anamneseMod.profissionalRepo,
      ).executar({
        clinicaId: sessao.clinicaId,
        solicitadoPorUsuarioId: sessao.usuarioId,
        prontuarioId: prontuario.id,
      }),
      new ObterEvolucoesDoProntuario(
        prontuarioMod.evolucaoRepo,
        prontuarioMod.prontuarioRepo,
        prontuarioMod.profissionalRepo,
      ).executar({
        clinicaId: sessao.clinicaId,
        solicitadoPorUsuarioId: sessao.usuarioId,
        prontuarioId: prontuario.id,
      }),
      new ListarProcedimentos(
        agendamentoMod.procedimentoRepo,
        agendamentoMod.profissionalRepo,
      ).executar({
        clinicaId: sessao.clinicaId,
        solicitadoPorUsuarioId: sessao.usuarioId,
      }),
    ]);

    const versoesDto = await mapearVersoesComNomes(sessao.clinicaId, versoes);
    const vigenteDto =
      versoesDto.find((v) => v.id === vigente?.id) ??
      (vigente ? anamneseParaDto(vigente, "Profissional") : null);
    const evolucoesDto = await mapearEvolucoesComNomes(
      sessao.clinicaId,
      evolucoes,
    );

    return {
      status: "prontuario",
      prontuario: prontuarioParaDto(prontuario),
      anamneseVigente: vigenteDto,
      versoes: versoesDto,
      evolucoes: evolucoesDto,
      procedimentos: procedimentos.map((p) => ({ id: p.id, label: p.nome })),
    };
  });

export const criarProntuarioAction = actionClient
  .inputSchema(z.object({ pacienteId: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const sessao = await exigirSessao();
    const mod = createProntuarioModule();
    const prontuario = await new CriarProntuario(
      mod.prontuarioRepo,
      mod.pacienteRepo,
      mod.profissionalRepo,
      mod.auditoria,
    ).executar({
      clinicaId: sessao.clinicaId,
      solicitadoPorUsuarioId: sessao.usuarioId,
      pacienteId: parsedInput.pacienteId,
    });
    return prontuarioParaDto(prontuario);
  });

export const preencherAnamneseAction = actionClient
  .inputSchema(
    z.object({
      prontuarioId: z.string().uuid(),
      respostas: anamneseFormSchema,
    }),
  )
  .action(async ({ parsedInput }) => {
    const sessao = await exigirSessao();
    const mod = createAnamneseModule();
    const anamnese = await new PreencherAnamnese(
      mod.anamneseRepo,
      mod.prontuarioRepo,
      mod.profissionalRepo,
      mod.auditoria,
    ).executar({
      clinicaId: sessao.clinicaId,
      solicitadoPorUsuarioId: sessao.usuarioId,
      prontuarioId: parsedInput.prontuarioId,
      respostas: respostasDoForm(parsedInput.respostas),
    });

    const membros = await mod.profissionalRepo.listarPorClinica(
      sessao.clinicaId,
    );
    const nome =
      membros.find((m) => m.id === anamnese.preenchidoPorProfissionalId)
        ?.nome ?? "Profissional";
    return anamneseParaDto(anamnese, nome);
  });

export const atualizarAnamneseAction = actionClient
  .inputSchema(
    z.object({
      prontuarioId: z.string().uuid(),
      respostas: anamneseFormSchema,
    }),
  )
  .action(async ({ parsedInput }) => {
    const sessao = await exigirSessao();
    const mod = createAnamneseModule();
    const anamnese = await new AtualizarAnamnese(
      mod.anamneseRepo,
      mod.prontuarioRepo,
      mod.profissionalRepo,
      mod.auditoria,
    ).executar({
      clinicaId: sessao.clinicaId,
      solicitadoPorUsuarioId: sessao.usuarioId,
      prontuarioId: parsedInput.prontuarioId,
      respostas: respostasDoForm(parsedInput.respostas),
    });

    const membros = await mod.profissionalRepo.listarPorClinica(
      sessao.clinicaId,
    );
    const nome =
      membros.find((m) => m.id === anamnese.preenchidoPorProfissionalId)
        ?.nome ?? "Profissional";
    return anamneseParaDto(anamnese, nome);
  });

export const registrarEvolucaoAction = actionClient
  .inputSchema(
    z.object({
      prontuarioId: z.string().uuid(),
      respostas: registrarEvolucaoFormSchema,
    }),
  )
  .action(async ({ parsedInput }) => {
    const sessao = await exigirSessao();
    const mod = createProntuarioModule();
    const procedimentoId =
      parsedInput.respostas.procedimentoId?.trim() || null;

    const evolucao = await new RegistrarEvolucao(
      mod.evolucaoRepo,
      mod.prontuarioRepo,
      mod.profissionalRepo,
      mod.auditoria,
    ).executar({
      clinicaId: sessao.clinicaId,
      solicitadoPorUsuarioId: sessao.usuarioId,
      prontuarioId: parsedInput.prontuarioId,
      descricao: parsedInput.respostas.descricao,
      procedimentoId,
    });

    const [membros, procedimentos] = await Promise.all([
      mod.profissionalRepo.listarPorClinica(sessao.clinicaId),
      createAgendamentoModule().procedimentoRepo.listarPorClinica(
        sessao.clinicaId,
      ),
    ]);
    const profissionalNome =
      membros.find((m) => m.id === evolucao.profissionalId)?.nome ??
      "Profissional";
    const procedimentoNome = evolucao.procedimentoId
      ? (procedimentos.find((p) => p.id === evolucao.procedimentoId)?.nome ??
        null)
      : null;

    return evolucaoParaDto(evolucao, {
      profissionalNome,
      procedimentoNome,
      jaRetificada: false,
    });
  });

export const retificarEvolucaoAction = actionClient
  .inputSchema(
    z.object({
      evolucaoId: z.string().uuid(),
      respostas: retificarEvolucaoFormSchema,
    }),
  )
  .action(async ({ parsedInput }) => {
    const sessao = await exigirSessao();
    const mod = createProntuarioModule();
    const evolucao = await new RetificarEvolucao(
      mod.evolucaoRepo,
      mod.profissionalRepo,
      mod.auditoria,
    ).executar({
      clinicaId: sessao.clinicaId,
      solicitadoPorUsuarioId: sessao.usuarioId,
      evolucaoId: parsedInput.evolucaoId,
      descricao: parsedInput.respostas.descricao,
      motivoRetificacao: parsedInput.respostas.motivoRetificacao,
    });

    const membros = await mod.profissionalRepo.listarPorClinica(
      sessao.clinicaId,
    );
    const profissionalNome =
      membros.find((m) => m.id === evolucao.profissionalId)?.nome ??
      "Profissional";

    return evolucaoParaDto(evolucao, {
      profissionalNome,
      procedimentoNome: null,
      jaRetificada: false,
    });
  });
