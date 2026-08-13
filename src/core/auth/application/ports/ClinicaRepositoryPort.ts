import type { Clinica, StatusClinica } from "../../domain/Clinica";
import type { DocumentoFiscal } from "../../domain/DocumentoFiscal";
import type { TemaClinica } from "../../domain/TemaClinica";

/** Filtros opcionais da listagem cross-tenant (spec 009). */
export type FiltrosListagemClinicas = {
  status?: StatusClinica;
  /** Busca textual simples em nome (implementação no adapter). */
  busca?: string;
};

/**
 * Patch seletivo da clínica. Campo omitido (`undefined`) não entra no
 * UPDATE — o valor atual no banco permanece (evita lost update).
 *
 * `null` em `logoUrl` / `tema` é valor enviado (remove logo / restaura
 * padrão). Documento fiscal fica de fora (imutável). `status` entra só
 * via `DesativarClinica` (soft-delete).
 */
export type AtualizarClinicaParcialInput = {
  id: string;
  nome?: string;
  endereco?: string;
  logoUrl?: string | null;
  tema?: TemaClinica | null;
  slug?: string;
  status?: StatusClinica;
};

export interface ClinicaRepositoryPort {
  salvar(clinica: Clinica): Promise<void>;
  /**
   * UPDATE seletivo só das colunas enviadas. Não reaproveitar `salvar`
   * (upsert da entidade inteira) para mutações parciais.
   */
  atualizarParcial(
    input: AtualizarClinicaParcialInput,
  ): Promise<Clinica | null>;
  buscarPorId(id: string): Promise<Clinica | null>;
  buscarPorDocumento(documento: DocumentoFiscal): Promise<Clinica | null>;
  /** Identificador público único na plataforma (link `/agendar/[slug]`). */
  buscarPorSlug(slug: string): Promise<Clinica | null>;
  /** Listagem cross-tenant — uso exclusivo do admin da plataforma (009). */
  listar(filtros?: FiltrosListagemClinicas): Promise<Clinica[]>;
}
