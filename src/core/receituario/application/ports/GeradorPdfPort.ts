import type { Atestado } from "@/core/atestado/domain/Atestado";

import type { Receita } from "../../domain/Receita";

/**
 * Gera PDF a partir de documento já snapshotado (specs 006 / 006b).
 * Adapter concreto: `pdf-lib` (sem headless Chrome). Sem persistir blob.
 *
 * Permanece neste módulo (dono original da 006) e é **estendida** com
 * `gerarAtestado`. Mover para `shared` faria `shared` importar entidades de
 * dois módulos de feature — pior. Port espelho no atestado duplicaria o
 * contrato do mesmo adapter.
 */
export interface GeradorPdfPort {
  gerar(receita: Receita): Promise<Uint8Array>;
  gerarAtestado(atestado: Atestado): Promise<Uint8Array>;
}
