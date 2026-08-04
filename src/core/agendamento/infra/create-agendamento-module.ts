import { db } from "@/db";
import {
  DrizzleClinicaRepository,
  DrizzleProfissionalRepository,
} from "@/core/auth/infra/adapters";
import { DrizzlePacienteRepository } from "@/core/paciente/infra/adapters";
import { VerificarAcessoAtivo } from "@/core/assinatura/application/use-cases/VerificarAcessoAtivo";
import { DrizzleAssinaturaRepository } from "@/core/assinatura/infra/adapters";

import { ConfigurarMenuPublicoDeProcedimentos } from "../application/use-cases/ConfigurarMenuPublicoDeProcedimentos";
import { ListarHorariosDisponiveisCore } from "../application/use-cases/listarHorariosDisponiveisCore";
import { ListarHorariosDisponiveisNoLinkPublico } from "../application/use-cases/ListarHorariosDisponiveisNoLinkPublico";
import { MarcarConsultaCore } from "../application/use-cases/marcarConsultaCore";
import { MarcarConsultaViaLinkPublico } from "../application/use-cases/MarcarConsultaViaLinkPublico";
import { ObterResumoAgendamentoPublico } from "../application/use-cases/ObterResumoAgendamentoPublico";
import { ResolverContextoAgendamentoPublico } from "../application/use-cases/ResolverContextoAgendamentoPublico";
import {
  DrizzleAgendamentoRepository,
  DrizzleDisponibilidadeProfissionalRepository,
  DrizzleLembretePort,
  DrizzleMenuPublicoProcedimentoRepository,
  DrizzleProcedimentoRepository,
  InMemoryRateLimitAdapter,
  TurnstileCaptchaAdapter,
  UpstashRateLimitAdapter,
} from "./adapters";

/** Composition root do módulo agendamento. */
export function createAgendamentoModule() {
  const profissionalRepo = new DrizzleProfissionalRepository(db);
  const pacienteRepo = new DrizzlePacienteRepository(db);
  const clinicaRepo = new DrizzleClinicaRepository(db);
  const agendamentoRepo = new DrizzleAgendamentoRepository(db);
  const disponibilidadeRepo = new DrizzleDisponibilidadeProfissionalRepository(
    db,
  );
  const procedimentoRepo = new DrizzleProcedimentoRepository(db);
  const menuRepo = new DrizzleMenuPublicoProcedimentoRepository(db);
  const lembrete = new DrizzleLembretePort(db);

  const verificarAcessoAtivo = new VerificarAcessoAtivo(
    new DrizzleAssinaturaRepository(db),
  );

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

  const rateLimit =
    UpstashRateLimitAdapter.fromEnv() ?? new InMemoryRateLimitAdapter();
  const captcha = new TurnstileCaptchaAdapter();

  return {
    profissionalRepo,
    pacienteRepo,
    clinicaRepo,
    agendamentoRepo,
    disponibilidadeRepo,
    procedimentoRepo,
    menuRepo,
    lembrete,
    rateLimit,
    captcha,
    verificarAcessoAtivo,
    resolverContextoAgendamentoPublico: new ResolverContextoAgendamentoPublico(
      clinicaRepo,
      profissionalRepo,
      verificarAcessoAtivo,
    ),
    obterResumoAgendamentoPublico: new ObterResumoAgendamentoPublico(
      clinicaRepo,
      profissionalRepo,
      menuRepo,
      procedimentoRepo,
    ),
    listarHorariosDisponiveisNoLinkPublico:
      new ListarHorariosDisponiveisNoLinkPublico(
        listarCore,
        profissionalRepo,
        verificarAcessoAtivo,
      ),
    marcarConsultaViaLinkPublico: new MarcarConsultaViaLinkPublico(
      marcarCore,
      pacienteRepo,
      profissionalRepo,
      procedimentoRepo,
      menuRepo,
      verificarAcessoAtivo,
    ),
    configurarMenuPublicoDeProcedimentos:
      new ConfigurarMenuPublicoDeProcedimentos(
        menuRepo,
        procedimentoRepo,
        profissionalRepo,
      ),
  };
}
