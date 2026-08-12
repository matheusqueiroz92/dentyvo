import type { Orcamento } from "@/core/orcamento/domain/Orcamento";
import type { StatusOrcamento } from "@/core/orcamento/domain/Orcamento";

import type { OrcamentoListaDTO } from "./types";

const STATUS_ROTULO: Record<StatusOrcamento, string> = {
  enviado: "Enviado",
  aceito: "Aceito",
  recusado: "Recusado",
};

export function orcamentoParaListaDto(
  orcamento: Orcamento,
  profissionalNome: string,
): OrcamentoListaDTO {
  return {
    id: orcamento.id,
    emitidoEmIso: orcamento.emitidoEm.toISOString(),
    profissionalNome,
    status: orcamento.status,
    statusRotulo: STATUS_ROTULO[orcamento.status],
    total: orcamento.total,
    validoAteIso: orcamento.validoAte
      ? orcamento.validoAte.toISOString().slice(0, 10)
      : null,
    itens: orcamento.itens.map((item) => ({
      procedimentoId: item.procedimentoId,
      nome: item.nome,
      valor: item.valor,
      quantidade: item.quantidade,
      subtotal: item.subtotal,
    })),
  };
}
