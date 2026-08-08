import type { Receita } from "@/core/receituario/domain/Receita";

import type { ReceitaListaDTO } from "./types";

export function receitaParaListaDto(
  receita: Receita,
  profissionalNome: string,
): ReceitaListaDTO {
  return {
    id: receita.id,
    emitidaEmIso: receita.emitidaEm.toISOString(),
    profissionalNome,
    quantidadeItens: receita.itens.length,
  };
}
