import type { MenuPublicoProcedimento } from "../../domain/MenuPublicoProcedimento";

/**
 * Persistência do menu público de procedimentos por clínica.
 * Ausência de registro ≡ menu vazio (catch-all na application).
 */
export interface MenuPublicoProcedimentoRepositoryPort {
  salvar(menu: MenuPublicoProcedimento): Promise<void>;
  /** Retorna menu vazio (`itens: []`) se a clínica ainda não configurou. */
  buscarPorClinicaId(clinicaId: string): Promise<MenuPublicoProcedimento>;
}
