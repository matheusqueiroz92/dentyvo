import { FakeUsuarioPlataformaRepository } from "@/core/admin-plataforma/application/test-doubles/fakes";
import { UsuarioPlataforma } from "@/core/admin-plataforma/domain/UsuarioPlataforma";
import type { PapelPlataforma } from "@/core/admin-plataforma/domain/PapelPlataforma";
import {
  CPF_VALIDO,
  FakeAuthPort,
  FakeClinicaRepository,
  FakeProfissionalRepository,
} from "@/core/auth/application/test-doubles/fakes";
import { Clinica } from "@/core/auth/domain/Clinica";
import { DocumentoFiscal } from "@/core/auth/domain/DocumentoFiscal";
import { Profissional } from "@/core/auth/domain/Profissional";
import type { Papel } from "@/core/auth/domain/Papel";
import type { EnviarNotificacaoInput } from "@/core/notificacao/application/use-cases/EnviarNotificacao";
import type { Notificacao } from "@/core/notificacao/domain";
import { Notificacao as NotificacaoEntity } from "@/core/notificacao/domain/Notificacao";
import { FakeAuditoriaLogPort } from "@/core/prontuario/application/test-doubles/fakes";

import { Assinatura } from "../../domain/Assinatura";
import { Plano } from "../../domain/Plano";
import type { EnviarNotificacaoPort } from "../ports/EnviarNotificacaoPort";
import {
  FakeAssinaturaGateway,
  FakeAssinaturaRepository,
  FakeCobrancaRepository,
  FakeEventoWebhookProcessadoPort,
  FakePlanoRepository,
  FakeVagaPromocionalRepository,
} from "../test-doubles/fakes";

export const CLINICA_ID = "clinica-assinatura-1";
export const PLANO_ID = "plano-basico";
export const PLANO_MEDIO_ID = "plano-medio";
export const PLANO_FULL_ID = "plano-full";
export const SUPER_ADMIN_ID = "plat-super-assinatura";

export class FakeEnviarNotificacaoPort implements EnviarNotificacaoPort {
  readonly chamadas: EnviarNotificacaoInput[] = [];

  async executar(input: EnviarNotificacaoInput): Promise<Notificacao> {
    this.chamadas.push(input);
    return NotificacaoEntity.criar({
      id: input.id,
      destinatario: input.destinatario,
      tipo: input.tipo,
      canais: input.canais,
      conteudo: input.conteudo,
      chaveNegocio: input.chaveNegocio,
      criadaEm: input.agora ?? new Date(),
    });
  }
}

export async function criarContextoAssinatura(papel: Papel = "admin") {
  const assinaturaRepo = new FakeAssinaturaRepository();
  const cobrancaRepo = new FakeCobrancaRepository();
  const planoRepo = new FakePlanoRepository();
  const vagaRepo = new FakeVagaPromocionalRepository();
  const gateway = new FakeAssinaturaGateway();
  const eventosProcessados = new FakeEventoWebhookProcessadoPort();
  const clinicaRepo = new FakeClinicaRepository();
  const profissionalRepo = new FakeProfissionalRepository();
  const usuarioPlataformaRepo = new FakeUsuarioPlataformaRepository();
  const auth = new FakeAuthPort();
  const auditoria = new FakeAuditoriaLogPort();
  const enviarNotificacao = new FakeEnviarNotificacaoPort();

  const clinica = Clinica.criar({
    id: CLINICA_ID,
    nome: "Clínica Assinatura",
    endereco: "Rua Teste, 100",
    documento: DocumentoFiscal.criar("cpf", CPF_VALIDO),
  });
  await clinicaRepo.salvar(clinica);

  const plano = Plano.criar({
    id: PLANO_ID,
    nome: "Básico",
    valorMensal: 99.9,
    limitesDeUso: { maxProfissionais: 3 },
  });
  await planoRepo.salvar(plano);

  const planoMedio = Plano.criar({
    id: PLANO_MEDIO_ID,
    nome: "Médio",
    valorMensal: 159,
  });
  await planoRepo.salvar(planoMedio);

  const planoFull = Plano.criar({
    id: PLANO_FULL_ID,
    nome: "Full",
    valorMensal: 279,
  });
  await planoRepo.salvar(planoFull);

  const usuario = await auth.criarUsuario({
    nome: "Usuário Clínica",
    email: `${papel}@clinica-assinatura.test`,
    senha: "senha-segura",
  });
  const profissional = Profissional.criar({
    id: `prof-${papel}`,
    clinicaId: CLINICA_ID,
    usuarioId: usuario.id,
    nome: "Usuário Clínica",
    papel,
    cro: papel === "dentista" ? "12345" : undefined,
  });
  await profissionalRepo.salvar(profissional);

  const superAdmin = UsuarioPlataforma.criar({
    id: SUPER_ADMIN_ID,
    nome: "Dono Dentyvo",
    email: "dono@dentyvo.com",
  });
  await usuarioPlataformaRepo.salvar(superAdmin);

  return {
    assinaturaRepo,
    cobrancaRepo,
    planoRepo,
    vagaRepo,
    gateway,
    eventosProcessados,
    clinicaRepo,
    profissionalRepo,
    usuarioPlataformaRepo,
    auth,
    auditoria,
    enviarNotificacao,
    clinica,
    plano,
    planoMedio,
    planoFull,
    profissional,
    solicitadoPorUsuarioId: usuario.id,
    superAdmin,
  };
}

export async function seedTrialAtivo(
  ctx: Awaited<ReturnType<typeof criarContextoAssinatura>>,
  dataInicio = new Date("2026-07-01T12:00:00.000Z"),
): Promise<Assinatura> {
  const trial = Assinatura.iniciarTrial({
    id: "assinatura-1",
    clinicaId: CLINICA_ID,
    dataInicio,
  });
  await ctx.assinaturaRepo.salvar(trial);
  return trial;
}

export async function esgotarVagasPromocionais(
  ctx: Awaited<ReturnType<typeof criarContextoAssinatura>>,
  agora = new Date("2026-07-01T12:00:00.000Z"),
): Promise<void> {
  for (let i = 1; i <= 30; i++) {
    await ctx.vagaRepo.reservarAtomico({
      clinicaId: `clinica-ocupante-${i}`,
      assinaturaId: `assinatura-ocupante-${i}`,
      agora,
    });
  }
}

/** Impostor só para testar o gate binário — bypassa factory de papel. */
export function usuarioPlataformaNaoSuperAdmin() {
  return UsuarioPlataforma.reconstituir({
    id: "plat-fake",
    nome: "Impostor",
    email: "imp@x.com",
    papel: "admin" as PapelPlataforma,
  });
}
