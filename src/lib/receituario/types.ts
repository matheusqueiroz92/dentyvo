export type ItemReceitaDTO = {
  medicamento: string;
  dosagem: string;
  posologia: string;
  duracao: string;
};

/** Entrada da lista no prontuário (imutável — sem campos de edição). */
export type ReceitaListaDTO = {
  id: string;
  emitidaEmIso: string;
  profissionalNome: string;
  quantidadeItens: number;
};

export type ArquivoPdfReceitaDTO = {
  pdfBase64: string;
  nomeArquivo: string;
  contentType: "application/pdf";
};
