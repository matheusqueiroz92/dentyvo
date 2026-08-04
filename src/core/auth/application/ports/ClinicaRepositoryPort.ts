import type { Clinica, StatusClinica } from "../../domain/Clinica";
import type { DocumentoFiscal } from "../../domain/DocumentoFiscal";

/** Filtros opcionais da listagem cross-tenant (spec 009). */
export type FiltrosListagemClinicas = {
  status?: StatusClinica;
  /** Busca textual simples em nome (implementação no adapter). */
  busca?: string;
};

export interface ClinicaRepositoryPort {
  salvar(clinica: Clinica): Promise<void>;
  buscarPorId(id: string): Promise<Clinica | null>;
  buscarPorDocumento(documento: DocumentoFiscal): Promise<Clinica | null>;
  /** Identificador público único na plataforma (link `/agendar/[slug]`). */
  buscarPorSlug(slug: string): Promise<Clinica | null>;
  /** Listagem cross-tenant — uso exclusivo do admin da plataforma (009). */
  listar(filtros?: FiltrosListagemClinicas): Promise<Clinica[]>;
}
