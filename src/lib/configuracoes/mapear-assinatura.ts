import type { DetalhesAssinatura } from "@/core/assinatura/domain/DetalhesAssinatura";

import type {
  DetalhesAssinaturaDTO,
  ItemHistoricoCobrancaDTO,
} from "./assinatura-types";

function isoOuNull(data: Date | null): string | null {
  return data ? data.toISOString() : null;
}

export function detalhesAssinaturaParaDto(
  detalhes: DetalhesAssinatura,
): DetalhesAssinaturaDTO {
  return {
    plano: detalhes.plano
      ? {
          nome: detalhes.plano.nome,
          valorMensal: detalhes.plano.valorMensal,
        }
      : null,
    status: detalhes.status,
    dataProximaCobrancaIso: isoOuNull(detalhes.dataProximaCobranca),
    historicoCobranca: detalhes.historicoCobranca.map(
      (item): ItemHistoricoCobrancaDTO => ({
        id: item.id,
        valor: item.valor,
        metodo: item.metodo,
        status: item.status,
        vencimentoIso: item.vencimento.toISOString(),
        pagaEmIso: isoOuNull(item.pagaEm),
      }),
    ),
    precoPromocionalAteIso: isoOuNull(detalhes.precoPromocionalAte),
    migradaParaPrecoCheioEmIso: isoOuNull(detalhes.migradaParaPrecoCheioEm),
    valorEfetivoCentavos: detalhes.valorEfetivoCentavos,
    origemValor: detalhes.origemValor,
    vagaPromocional: detalhes.vagaPromocional,
    linkRegularizacao: detalhes.linkRegularizacao,
  };
}
