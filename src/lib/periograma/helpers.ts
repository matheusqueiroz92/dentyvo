import type { TipoPeriograma } from "@/core/periograma/domain/Periograma";
import type { SistemaFurca } from "@/core/periograma/domain/ClassificacaoFurca";
import type {
  LadoSondagem,
  PosicaoSondagem,
} from "@/core/periograma/domain/PontoSondagem";
import type { DentePeriogramaDTO, PontoSondagemDTO } from "./types";

export const ROTULOS_TIPO_PERIOGRAMA: Record<TipoPeriograma, string> = {
  exame_inicial: "Exame inicial",
  reavaliacao: "Reavaliação",
};

export const ROTULOS_SISTEMA_FURCA: Record<SistemaFurca, string> = {
  hamp: "Hamp",
  glickman: "Glickman",
};

export const ROTULOS_LADO: Record<LadoSondagem, string> = {
  vestibular: "Vestibular",
  palatina_lingual: "Palatina / lingual",
};

export const ROTULOS_POSICAO: Record<PosicaoSondagem, string> = {
  mesial: "Mesial",
  central: "Central",
  distal: "Distal",
};

/** Todos os 6 sítios de sondagem na ordem visual (vestibular M-C-D, depois palatina). */
export const PONTOS_SONDAGEM_PADRAO: Array<{
  lado: LadoSondagem;
  posicao: PosicaoSondagem;
}> = [
  { lado: "vestibular", posicao: "mesial" },
  { lado: "vestibular", posicao: "central" },
  { lado: "vestibular", posicao: "distal" },
  { lado: "palatina_lingual", posicao: "mesial" },
  { lado: "palatina_lingual", posicao: "central" },
  { lado: "palatina_lingual", posicao: "distal" },
];

export function chavePonto(lado: LadoSondagem, posicao: PosicaoSondagem): string {
  return `${lado}:${posicao}`;
}

export function pontoVazio(
  lado: LadoSondagem,
  posicao: PosicaoSondagem,
): PontoSondagemDTO {
  return {
    lado,
    posicao,
    margemGengival: null,
    profundidadeSondagem: null,
    placa: null,
    sangramentoSondagem: null,
  };
}

export function pontoTemMedicao(p: PontoSondagemDTO): boolean {
  return (
    p.margemGengival != null ||
    p.profundidadeSondagem != null ||
    p.placa != null ||
    p.sangramentoSondagem != null
  );
}

export function denteTemDados(d: DentePeriogramaDTO): boolean {
  if (d.mobilidade != null) return true;
  if (d.implante != null) return true;
  if (d.classificacaoFurca != null) return true;
  if (d.nota != null && d.nota.trim().length > 0) return true;
  return d.pontos.some(pontoTemMedicao);
}

/** Remove pontos sem medição e normaliza nota vazia → null para o payload. */
export function denteParaPayload(d: DentePeriogramaDTO): DentePeriogramaDTO {
  return {
    ...d,
    nota: d.nota?.trim() ? d.nota.trim() : null,
    pontos: d.pontos.filter(pontoTemMedicao),
  };
}

export function dentePeriogramaVazio(numeroDente: number): DentePeriogramaDTO {
  return {
    numeroDente,
    mobilidade: null,
    implante: null,
    classificacaoFurca: null,
    nota: null,
    pontos: PONTOS_SONDAGEM_PADRAO.map((p) => pontoVazio(p.lado, p.posicao)),
  };
}

export function mesclarPontosComPadrao(
  pontos: PontoSondagemDTO[],
): PontoSondagemDTO[] {
  const mapa = new Map(
    pontos.map((p) => [chavePonto(p.lado, p.posicao), p] as const),
  );
  return PONTOS_SONDAGEM_PADRAO.map((padrao) => {
    const existente = mapa.get(chavePonto(padrao.lado, padrao.posicao));
    return existente ?? pontoVazio(padrao.lado, padrao.posicao);
  });
}
