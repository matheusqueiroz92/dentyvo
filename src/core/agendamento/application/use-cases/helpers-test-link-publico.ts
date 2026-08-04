import {
  CPF_VALIDO,
  FakeClinicaRepository,
  FakeProfissionalRepository,
} from "@/core/auth/application/test-doubles/fakes";
import { Clinica } from "@/core/auth/domain/Clinica";
import { DocumentoFiscal } from "@/core/auth/domain/DocumentoFiscal";
import { Profissional } from "@/core/auth/domain/Profissional";
import { FakeAssinaturaRepository } from "@/core/assinatura/application/test-doubles/fakes";
import { VerificarAcessoAtivo } from "@/core/assinatura/application/use-cases/VerificarAcessoAtivo";
import { Assinatura } from "@/core/assinatura/domain/Assinatura";
import { FakePacienteRepository } from "@/core/paciente/application/test-doubles/fakes";
import { Paciente } from "@/core/paciente/domain/Paciente";

import { DisponibilidadeProfissional } from "../../domain/DisponibilidadeProfissional";
import { MenuPublicoProcedimento } from "../../domain/MenuPublicoProcedimento";
import { Procedimento } from "../../domain/Procedimento";
import {
  FakeAgendamentoRepository,
  FakeDisponibilidadeRepository,
  FakeLembretePort,
  FakeMenuPublicoProcedimentoRepository,
  FakeProcedimentoRepository,
} from "../test-doubles/fakes";
import { ListarHorariosDisponiveisCore } from "./listarHorariosDisponiveisCore";
import { MarcarConsultaCore } from "./marcarConsultaCore";
import { segundaAs } from "./helpers-test";

export const SLUG_CLINICA = "clinica-sorriso";
export const SLUG_PROFISSIONAL = "dr-agenda";
export const CPF_PACIENTE_PUBLICO = "39053344705";
/** Outro CPF válido para criação de paciente novo. */
export const CPF_PACIENTE_NOVO = "52998224725";

/**
 * Clínica ativa + trial, dentista com disponibilidade, procedimentos e menu.
 */
export async function seedContextoLinkPublico(opcoes?: {
  slugClinica?: string;
  statusClinica?: "ativa" | "inativa";
  comAssinaturaAtiva?: boolean;
  comMenuConfigurado?: boolean;
}) {
  const slugClinica = opcoes?.slugClinica ?? SLUG_CLINICA;
  const clinicaRepo = new FakeClinicaRepository();
  const profissionalRepo = new FakeProfissionalRepository();
  const pacienteRepo = new FakePacienteRepository();
  const agendamentoRepo = new FakeAgendamentoRepository();
  const disponibilidadeRepo = new FakeDisponibilidadeRepository();
  const procedimentoRepo = new FakeProcedimentoRepository();
  const menuRepo = new FakeMenuPublicoProcedimentoRepository();
  const lembrete = new FakeLembretePort();
  const assinaturaRepo = new FakeAssinaturaRepository();

  let clinica = Clinica.criar({
    id: "clinica-publica-1",
    nome: "Clínica Sorriso",
    endereco: "Rua Pública, 1",
    documento: DocumentoFiscal.criar("cpf", CPF_VALIDO),
    slug: slugClinica,
  });
  if (opcoes?.statusClinica === "inativa") {
    clinica = clinica.desativar();
  }
  await clinicaRepo.salvar(clinica);

  if (opcoes?.comAssinaturaAtiva !== false) {
    // Trial recente para permanecer `permitido` com `VerificarAcessoAtivo`
    // usando `agora = new Date()` (14 dias corridos).
    await assinaturaRepo.salvar(
      Assinatura.iniciarTrial({
        id: "assinatura-publica-1",
        clinicaId: clinica.id,
        dataInicio: new Date(),
      }),
    );
  }

  const dentista = Profissional.criar({
    id: "prof-publico-1",
    clinicaId: clinica.id,
    usuarioId: "user-dentista-publico",
    nome: "Dr. Agenda",
    papel: "dentista",
    cro: "88888",
    slug: SLUG_PROFISSIONAL,
  });
  await profissionalRepo.salvar(dentista);

  const admin = Profissional.criar({
    id: "prof-admin-publico",
    clinicaId: clinica.id,
    usuarioId: "user-admin-publico",
    nome: "Admin Clínica",
    papel: "admin",
    slug: "admin-clinica",
  });
  await profissionalRepo.salvar(admin);

  const recepcao = Profissional.criar({
    id: "prof-recepcao-publico",
    clinicaId: clinica.id,
    usuarioId: "user-recepcao-publico",
    nome: "Recepção",
    papel: "recepcao",
    slug: "recepcao",
  });
  await profissionalRepo.salvar(recepcao);

  const procedimentoConsulta = Procedimento.criar({
    id: "proc-consulta",
    clinicaId: clinica.id,
    nome: "Consulta/Avaliação",
    duracaoPadraoMinutos: 60,
    valor: 150,
  });
  const procedimentoLimpeza = Procedimento.criar({
    id: "proc-limpeza",
    clinicaId: clinica.id,
    nome: "Limpeza",
    duracaoPadraoMinutos: 60,
    valor: 200,
  });
  await procedimentoRepo.salvar(procedimentoConsulta);
  await procedimentoRepo.salvar(procedimentoLimpeza);

  if (opcoes?.comMenuConfigurado) {
    await menuRepo.salvar(
      MenuPublicoProcedimento.configurar(clinica.id, [
        {
          rotuloPublico: "Consulta/Avaliação",
          procedimentoId: procedimentoConsulta.id,
        },
        {
          rotuloPublico: "Limpeza",
          procedimentoId: procedimentoLimpeza.id,
        },
      ]),
    );
  }

  await disponibilidadeRepo.substituirJanelas(clinica.id, dentista.id, [
    DisponibilidadeProfissional.criar({
      id: "jan-manha-pub",
      clinicaId: clinica.id,
      profissionalId: dentista.id,
      diaDaSemana: 1,
      horaInicio: "08:00",
      horaFim: "12:00",
    }),
    DisponibilidadeProfissional.criar({
      id: "jan-tarde-pub",
      clinicaId: clinica.id,
      profissionalId: dentista.id,
      diaDaSemana: 1,
      horaInicio: "14:00",
      horaFim: "18:00",
    }),
  ]);

  const verificarAcessoAtivo = new VerificarAcessoAtivo(assinaturaRepo);
  const listarCore = new ListarHorariosDisponiveisCore(
    disponibilidadeRepo,
    agendamentoRepo,
    profissionalRepo,
  );
  const marcarCore = new MarcarConsultaCore(
    agendamentoRepo,
    disponibilidadeRepo,
    procedimentoRepo,
    pacienteRepo,
    profissionalRepo,
    lembrete,
  );

  return {
    clinica,
    clinicaId: clinica.id,
    slugClinica,
    dentista,
    admin,
    recepcao,
    procedimentoConsulta,
    procedimentoLimpeza,
    clinicaRepo,
    profissionalRepo,
    pacienteRepo,
    agendamentoRepo,
    disponibilidadeRepo,
    procedimentoRepo,
    menuRepo,
    lembrete,
    assinaturaRepo,
    verificarAcessoAtivo,
    listarCore,
    marcarCore,
    segundaAs,
  };
}

export async function seedPacienteExistente(
  ctx: Awaited<ReturnType<typeof seedContextoLinkPublico>>,
  dados?: { nome?: string; telefone?: string; cpf?: string },
) {
  const paciente = Paciente.criar({
    id: "pac-existente",
    clinicaId: ctx.clinicaId,
    nome: dados?.nome ?? "Paciente Já Cadastrado",
    cpf: dados?.cpf ?? CPF_PACIENTE_PUBLICO,
    telefone: dados?.telefone ?? "77988887777",
    dataNascimento: new Date("1990-01-01T12:00:00.000Z"),
  });
  await ctx.pacienteRepo.salvar(paciente);
  return paciente;
}
