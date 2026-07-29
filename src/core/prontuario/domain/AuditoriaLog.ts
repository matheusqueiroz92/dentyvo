import { DadosInvalidosError } from "@/core/shared/errors";

export const ACOES_AUDITORIA = ["leitura", "escrita", "acesso_negado"] as const;
export type AcaoAuditoria = (typeof ACOES_AUDITORIA)[number];

export const RECURSOS_AUDITORIA = [
  "prontuario",
  "anamnese",
  "evolucao",
  /** Spec 009 — ações do admin da plataforma sobre tenant/membros. */
  "clinica",
  "profissional",
  /** Spec 010 — concessão manual de acesso / ações de assinatura. */
  "assinatura",
] as const;
export type RecursoAuditoria = (typeof RECURSOS_AUDITORIA)[number];

/**
 * Metadados apenas — nunca texto clínico (descrição de evolução, respostas
 * de anamnese). Spec 003: minimização de dado sensível em log.
 */
export type DetalheAuditoria = {
  versaoAnamnese?: number;
  evolucaoId?: string;
  evolucaoRetificadaId?: string;
  acaoNegada?: string;
  /** Motivo de desativação de clínica (spec 009) — sem PHI. */
  motivo?: string;
};

export type AuditoriaLogProps = {
  id: string;
  /** Nullable apenas para ator `UsuarioPlataforma` em ações cross-tenant (009). */
  clinicaId: string | null;
  atorUsuarioId: string;
  /** Null quando o ator é `UsuarioPlataforma` (sem vínculo a clínica). */
  atorProfissionalId: string | null;
  /** Preenchido quando o ator é super-admin da plataforma (009). */
  atorUsuarioPlataformaId: string | null;
  acao: AcaoAuditoria;
  recursoTipo: RecursoAuditoria;
  recursoId: string;
  pacienteId: string | null;
  ocorridoEm: Date;
  detalhe: DetalheAuditoria | null;
};

/**
 * Evento de auditoria de acesso a dado clínico / tenant (spec 003 + 009).
 * Entidade imutável; persistência via `AuditoriaLogPort`.
 *
 * Invariante de ator: exatamente um entre profissional da clínica e
 * usuário da plataforma.
 */
export class AuditoriaLog {
  readonly id: string;
  readonly clinicaId: string | null;
  readonly atorUsuarioId: string;
  readonly atorProfissionalId: string | null;
  readonly atorUsuarioPlataformaId: string | null;
  readonly acao: AcaoAuditoria;
  readonly recursoTipo: RecursoAuditoria;
  readonly recursoId: string;
  readonly pacienteId: string | null;
  readonly ocorridoEm: Date;
  readonly detalhe: DetalheAuditoria | null;

  private constructor(props: AuditoriaLogProps) {
    this.id = props.id;
    this.clinicaId = props.clinicaId;
    this.atorUsuarioId = props.atorUsuarioId;
    this.atorProfissionalId = props.atorProfissionalId;
    this.atorUsuarioPlataformaId = props.atorUsuarioPlataformaId;
    this.acao = props.acao;
    this.recursoTipo = props.recursoTipo;
    this.recursoId = props.recursoId;
    this.pacienteId = props.pacienteId;
    this.ocorridoEm = props.ocorridoEm;
    this.detalhe = props.detalhe;
  }

  static criar(input: {
    id: string;
    clinicaId?: string | null;
    atorUsuarioId: string;
    atorProfissionalId?: string | null;
    atorUsuarioPlataformaId?: string | null;
    acao: AcaoAuditoria;
    recursoTipo: RecursoAuditoria;
    recursoId: string;
    pacienteId?: string | null;
    ocorridoEm?: Date;
    detalhe?: DetalheAuditoria | null;
  }): AuditoriaLog {
    if (!(ACOES_AUDITORIA as readonly string[]).includes(input.acao)) {
      throw new DadosInvalidosError(`Ação de auditoria inválida: ${input.acao}`);
    }
    if (!(RECURSOS_AUDITORIA as readonly string[]).includes(input.recursoTipo)) {
      throw new DadosInvalidosError(
        `Tipo de recurso de auditoria inválido: ${input.recursoTipo}`,
      );
    }

    const ocorridoEm = input.ocorridoEm ?? new Date();
    if (!(ocorridoEm instanceof Date) || Number.isNaN(ocorridoEm.getTime())) {
      throw new DadosInvalidosError("ocorridoEm inválida.");
    }

    const atorUsuarioPlataformaId = normalizarOpcional(
      input.atorUsuarioPlataformaId,
    );
    const atorProfissionalId = normalizarOpcional(input.atorProfissionalId);
    const clinicaId = normalizarOpcional(input.clinicaId);

    assertAtorValido({
      atorProfissionalId,
      atorUsuarioPlataformaId,
      clinicaId,
    });

    return new AuditoriaLog({
      id: assertCampo(input.id, "id"),
      clinicaId,
      atorUsuarioId: assertCampo(input.atorUsuarioId, "atorUsuarioId"),
      atorProfissionalId,
      atorUsuarioPlataformaId,
      acao: input.acao,
      recursoTipo: input.recursoTipo,
      recursoId: assertCampo(input.recursoId, "recursoId"),
      pacienteId: normalizarOpcional(input.pacienteId),
      ocorridoEm,
      detalhe: sanitizarDetalhe(input.detalhe ?? null),
    });
  }

  static reconstituir(props: AuditoriaLogProps): AuditoriaLog {
    return new AuditoriaLog(props);
  }
}

function assertAtorValido(input: {
  atorProfissionalId: string | null;
  atorUsuarioPlataformaId: string | null;
  clinicaId: string | null;
}): void {
  const temProfissional = input.atorProfissionalId != null;
  const temPlataforma = input.atorUsuarioPlataformaId != null;

  if (temProfissional === temPlataforma) {
    throw new DadosInvalidosError(
      "Auditoria exige exatamente um ator: profissional da clínica ou usuário da plataforma.",
    );
  }

  if (temProfissional && input.clinicaId == null) {
    throw new DadosInvalidosError(
      "clinicaId é obrigatório quando o ator é profissional da clínica.",
    );
  }
}

function assertCampo(valor: string, campo: string): string {
  const trimmed = valor.trim();
  if (!trimmed) {
    throw new DadosInvalidosError(`${campo} da auditoria é obrigatório.`);
  }
  return trimmed;
}

function normalizarOpcional(valor: string | null | undefined): string | null {
  if (valor == null) return null;
  const trimmed = valor.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Garante que `detalhe` só carrega chaves permitidas (metadados/IDs). */
function sanitizarDetalhe(
  detalhe: DetalheAuditoria | null,
): DetalheAuditoria | null {
  if (detalhe == null) return null;

  const limpo: DetalheAuditoria = {};
  if (detalhe.versaoAnamnese !== undefined) {
    if (
      typeof detalhe.versaoAnamnese !== "number" ||
      !Number.isInteger(detalhe.versaoAnamnese)
    ) {
      throw new DadosInvalidosError("detalhe.versaoAnamnese inválido.");
    }
    limpo.versaoAnamnese = detalhe.versaoAnamnese;
  }
  if (detalhe.evolucaoId !== undefined) {
    limpo.evolucaoId = assertCampo(detalhe.evolucaoId, "detalhe.evolucaoId");
  }
  if (detalhe.evolucaoRetificadaId !== undefined) {
    limpo.evolucaoRetificadaId = assertCampo(
      detalhe.evolucaoRetificadaId,
      "detalhe.evolucaoRetificadaId",
    );
  }
  if (detalhe.acaoNegada !== undefined) {
    limpo.acaoNegada = assertCampo(detalhe.acaoNegada, "detalhe.acaoNegada");
  }
  if (detalhe.motivo !== undefined) {
    limpo.motivo = assertCampo(detalhe.motivo, "detalhe.motivo");
  }

  return Object.keys(limpo).length > 0 ? limpo : null;
}
