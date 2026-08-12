import type {
  LadoSondagem,
  PosicaoSondagem,
} from "@/core/periograma/domain/PontoSondagem";
import type { SistemaFurca } from "@/core/periograma/domain/ClassificacaoFurca";
import type { TipoPeriograma } from "@/core/periograma/domain/Periograma";

export type ClassificacaoFurcaDTO = {
  sistema: SistemaFurca;
  grau: number;
};

export type PontoSondagemDTO = {
  lado: LadoSondagem;
  posicao: PosicaoSondagem;
  margemGengival: number | null;
  profundidadeSondagem: number | null;
  placa: boolean | null;
  sangramentoSondagem: boolean | null;
};

export type DentePeriogramaDTO = {
  numeroDente: number;
  mobilidade: number | null;
  implante: boolean | null;
  classificacaoFurca: ClassificacaoFurcaDTO | null;
  nota: string | null;
  pontos: PontoSondagemDTO[];
};

export type PeriogramaDTO = {
  id: string;
  prontuarioId: string;
  profissionalId: string;
  profissionalNome: string;
  tipo: TipoPeriograma;
  registradoEmIso: string;
  dentes: DentePeriogramaDTO[];
};

/** Resumo para a lista do histórico (sem pontos). */
export type PeriogramaListaDTO = {
  id: string;
  prontuarioId: string;
  profissionalId: string;
  profissionalNome: string;
  tipo: TipoPeriograma;
  registradoEmIso: string;
  quantidadeDentes: number;
};
