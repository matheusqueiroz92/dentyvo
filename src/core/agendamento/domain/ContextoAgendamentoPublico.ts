import type { Clinica } from "@/core/auth/domain/Clinica";
import { Slug } from "@/core/shared/Slug";

import { ClinicaInelegivelParaLinkPublicoError } from "./errors";

export const CANAL_AGENDAMENTO_PUBLICO = "link-publico" as const;
export type CanalAgendamentoPublico = typeof CANAL_AGENDAMENTO_PUBLICO;

export type ContextoAgendamentoPublicoProps = {
  clinicaId: string;
  slug: string;
  profissionalSlug?: string;
};

/**
 * Contexto do canal público — substitui `ContextoSessao` neste fluxo.
 * Resolvido somente a partir de slug(s); `canal` é sempre `link-publico`.
 *
 * Gate cadastral (`Clinica.status = ativa`) vive em
 * {@link assertClinicaAtivaParaLinkPublico} / {@link montarContextoAgendamentoPublico}.
 * Gate de assinatura (`VerificarAcessoAtivo`) permanece na application.
 */
export class ContextoAgendamentoPublico {
  readonly clinicaId: string;
  readonly canal: CanalAgendamentoPublico = CANAL_AGENDAMENTO_PUBLICO;
  readonly slug: string;
  readonly profissionalSlug: string | undefined;

  private constructor(props: {
    clinicaId: string;
    slug: string;
    profissionalSlug?: string;
  }) {
    this.clinicaId = props.clinicaId;
    this.slug = props.slug;
    this.profissionalSlug = props.profissionalSlug;
  }

  static criar(props: ContextoAgendamentoPublicoProps): ContextoAgendamentoPublico {
    const slug = Slug.criar(props.slug).valor;
    const profissionalSlug =
      props.profissionalSlug == null || props.profissionalSlug.trim() === ""
        ? undefined
        : Slug.criar(props.profissionalSlug).valor;

    return new ContextoAgendamentoPublico({
      clinicaId: props.clinicaId,
      slug,
      profissionalSlug,
    });
  }

  get profissionalPreResolvido(): boolean {
    return this.profissionalSlug != null;
  }
}

/**
 * Valida elegibilidade cadastral da clínica para o canal público.
 * Não cobre assinatura — isso é `VerificarAcessoAtivo` (010) na application.
 */
export function assertClinicaAtivaParaLinkPublico(clinica: Clinica): void {
  if (clinica.status !== "ativa") {
    throw new ClinicaInelegivelParaLinkPublicoError(clinica.id, clinica.status);
  }
}

/**
 * Monta o contexto após a clínica já ter sido carregada por slug.
 * Garante `status = ativa` e alinha `slug` do contexto ao da entidade.
 */
export function montarContextoAgendamentoPublico(input: {
  clinica: Clinica;
  profissionalSlug?: string;
}): ContextoAgendamentoPublico {
  assertClinicaAtivaParaLinkPublico(input.clinica);
  return ContextoAgendamentoPublico.criar({
    clinicaId: input.clinica.id,
    slug: input.clinica.slug,
    profissionalSlug: input.profissionalSlug,
  });
}
