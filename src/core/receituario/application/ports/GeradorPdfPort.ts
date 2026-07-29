import type { Receita } from "../../domain/Receita";

/**
 * Gera PDF a partir da receita já snapshotada (spec 006).
 * Adapter concreto: `pdf-lib` (sem headless Chrome). Sem persistir blob.
 */
export interface GeradorPdfPort {
  gerar(receita: Receita): Promise<Uint8Array>;
}
