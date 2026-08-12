import type { StatusOrcamento } from "@/core/orcamento/domain/Orcamento";

export type ItemOrcamentoDTO = {
  procedimentoId: string;
  nome: string;
  valor: number;
  quantidade: number;
  subtotal: number;
};

export type OrcamentoListaDTO = {
  id: string;
  emitidoEmIso: string;
  profissionalNome: string;
  status: StatusOrcamento;
  statusRotulo: string;
  total: number;
  validoAteIso: string | null;
  itens: ItemOrcamentoDTO[];
};

export type ArquivoPdfOrcamentoDTO = {
  pdfBase64: string;
  nomeArquivo: string;
  contentType: "application/pdf";
};

export type ProcedimentoOrcamentoOpcao = {
  id: string;
  nome: string;
  valor: number;
};

export type ContextoOrcamentoDTO = {
  prontuarioId: string | null;
  procedimentos: ProcedimentoOrcamentoOpcao[];
};
