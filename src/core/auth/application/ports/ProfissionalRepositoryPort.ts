import type { Profissional } from "../../domain/Profissional";

/**
 * Patch seletivo do profissional. Campo omitido (`undefined`) não entra
 * no UPDATE — o valor atual no banco permanece (evita lost update de
 * slug/CRO/papel/especialidade). Mesmo padrão de `AtualizarClinicaParcialInput`.
 */
export type AtualizarProfissionalParcialInput = {
  id: string;
  clinicaId: string;
  nome?: string;
};

export interface ProfissionalRepositoryPort {
  salvar(profissional: Profissional): Promise<void>;
  /**
   * UPDATE seletivo só das colunas enviadas. Não reaproveitar `salvar`
   * (upsert da entidade inteira) para mutações parciais.
   */
  atualizarParcial(
    input: AtualizarProfissionalParcialInput,
  ): Promise<Profissional | null>;
  /** Escopado por tenant — nunca retornar membro de outra clínica. */
  buscarPorId(
    clinicaId: string,
    profissionalId: string,
  ): Promise<Profissional | null>;
  /** Slug único por clínica (não global) — link `/agendar/[slug]/[profissionalSlug]`. */
  buscarPorSlug(
    clinicaId: string,
    slug: string,
  ): Promise<Profissional | null>;
  buscarPorUsuarioId(usuarioId: string): Promise<Profissional | null>;
  listarPorClinica(clinicaId: string): Promise<Profissional[]>;
  remover(clinicaId: string, profissionalId: string): Promise<void>;
}
