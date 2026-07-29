import { DadosInvalidosError } from "@/core/shared/errors";

import { MetodoPagamentoNaoSuportadoError } from "./errors";

/** Métodos do domain model — `cartao` reservado para iteração pós-MVP. */
export const METODOS_PAGAMENTO = ["pix", "boleto", "cartao"] as const;
export type MetodoPagamento = (typeof METODOS_PAGAMENTO)[number];

/** Métodos aceitos por `CriarAssinatura` no MVP (spec 010). */
export const METODOS_PAGAMENTO_MVP = ["pix", "boleto"] as const;
export type MetodoPagamentoMvp = (typeof METODOS_PAGAMENTO_MVP)[number];

export function assertMetodoPagamento(valor: string): MetodoPagamento {
  if (!(METODOS_PAGAMENTO as readonly string[]).includes(valor)) {
    throw new DadosInvalidosError(`Método de pagamento inválido: ${valor}`);
  }
  return valor as MetodoPagamento;
}

/** Rejeita `cartao` e valores desconhecidos no fluxo de criação do MVP. */
export function assertMetodoPagamentoMvp(valor: string): MetodoPagamentoMvp {
  if (!(METODOS_PAGAMENTO_MVP as readonly string[]).includes(valor)) {
    throw new MetodoPagamentoNaoSuportadoError(valor);
  }
  return valor as MetodoPagamentoMvp;
}
