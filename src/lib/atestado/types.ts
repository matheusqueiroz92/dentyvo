/** Entrada da lista no prontuário (imutável — sem campos de edição). */
export type AtestadoListaDTO = {
  id: string;
  emitidaEmIso: string;
  profissionalNome: string;
  motivo: string;
  motivoResumo: string;
  cid: string | null;
  dataInicioIso: string;
  dataFimIso: string;
  quantidadeDias: number;
  periodoRotulo: string;
};

export type ArquivoPdfAtestadoDTO = {
  pdfBase64: string;
  nomeArquivo: string;
  contentType: "application/pdf";
};
