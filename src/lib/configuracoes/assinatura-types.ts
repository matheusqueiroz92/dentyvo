import type { MetodoPagamento } from "@/core/assinatura/domain/MetodoPagamento";
import type { StatusAssinatura } from "@/core/assinatura/domain/StatusAssinatura";
import type { StatusCobranca } from "@/core/assinatura/domain/StatusCobranca";

export type ItemHistoricoCobrancaDTO = {
  id: string;
  valor: number;
  metodo: MetodoPagamento;
  status: StatusCobranca;
  vencimentoIso: string;
  pagaEmIso: string | null;
};

export type DetalhesAssinaturaDTO = {
  plano: { nome: string; valorMensal: number } | null;
  status: StatusAssinatura;
  dataProximaCobrancaIso: string | null;
  historicoCobranca: ItemHistoricoCobrancaDTO[];
  precoPromocionalAteIso: string | null;
  migradaParaPrecoCheioEmIso: string | null;
  valorEfetivoCentavos: number | null;
  origemValor: "promocional" | "cheio" | null;
  vagaPromocional: { posicao: number } | null;
  linkRegularizacao: string | null;
};
