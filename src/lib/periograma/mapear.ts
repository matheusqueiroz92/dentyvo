import type { Periograma } from "@/core/periograma/domain/Periograma";

import type { PeriogramaDTO, PeriogramaListaDTO } from "./types";

export function periogramaParaDto(
  periograma: Periograma,
  profissionalNome: string,
): PeriogramaDTO {
  return {
    id: periograma.id,
    prontuarioId: periograma.prontuarioId,
    profissionalId: periograma.profissionalId,
    profissionalNome,
    tipo: periograma.tipo,
    registradoEmIso: periograma.registradoEm.toISOString(),
    dentes: periograma.dentes.map((d) => ({
      numeroDente: d.numeroDenteValor,
      mobilidade: d.mobilidade,
      implante: d.implante,
      classificacaoFurca: d.classificacaoFurca?.paraProps() ?? null,
      nota: d.nota,
      pontos: d.pontos.map((p) => p.paraProps()),
    })),
  };
}

export function periogramaParaListaDto(
  periograma: Periograma,
  profissionalNome: string,
): PeriogramaListaDTO {
  return {
    id: periograma.id,
    prontuarioId: periograma.prontuarioId,
    profissionalId: periograma.profissionalId,
    profissionalNome,
    tipo: periograma.tipo,
    registradoEmIso: periograma.registradoEm.toISOString(),
    quantidadeDentes: periograma.dentes.length,
  };
}
