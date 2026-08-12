import type { Atestado } from "@/core/atestado/domain/Atestado";
import type { Orcamento } from "@/core/orcamento/domain/Orcamento";

import type { Receita } from "../../domain/Receita";

/**
 * Gera PDF a partir de documento já snapshotado (specs 006 / 006b / 015).
 * Adapter concreto: `pdf-lib` (sem headless Chrome). Sem persistir blob.
 *
 * Permanece neste módulo (dono original da 006) e é **estendida** com
 * `gerarAtestado` / `gerarOrcamento`. Mover para `shared` faria `shared`
 * importar entidades de vários módulos de feature — pior. Port espelho
 * em cada módulo duplicaria o contrato do mesmo adapter.
 */
export interface GeradorPdfPort {
  gerar(receita: Receita): Promise<Uint8Array>;
  gerarAtestado(atestado: Atestado): Promise<Uint8Array>;
  gerarOrcamento(orcamento: Orcamento): Promise<Uint8Array>;
}
