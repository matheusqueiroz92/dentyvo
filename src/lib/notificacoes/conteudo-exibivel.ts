import { TIMEZONE_PADRAO } from "@/core/agendamento/domain/constants";
import type { NotificacaoDashboardDTO } from "@/lib/dashboard/types";
import { formatBRL } from "@/lib/design-tokens";

export type LinhaConteudoExibivel = {
  chave: "planoNome" | "dataReferenciaIso" | "valorCentavos";
  rotulo: string;
  valor: string;
};

const dataReferenciaFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TIMEZONE_PADRAO,
  dateStyle: "short",
});

/**
 * Campos da allowlist de ConteudoNotificacao que a UI pode mostrar.
 * IDs opacos (agendamentoId, cobrancaId, …) ficam de fora — não ajudam o
 * usuário e o DTO sequer os carrega.
 */
export function linhasConteudoExibivel(
  n: NotificacaoDashboardDTO,
): LinhaConteudoExibivel[] {
  const linhas: LinhaConteudoExibivel[] = [];

  if (n.planoNome) {
    linhas.push({ chave: "planoNome", rotulo: "Plano", valor: n.planoNome });
  }
  if (n.dataReferenciaIso) {
    linhas.push({
      chave: "dataReferenciaIso",
      rotulo: "Data de referência",
      valor: dataReferenciaFmt.format(new Date(n.dataReferenciaIso)),
    });
  }
  if (n.valorCentavos != null) {
    linhas.push({
      chave: "valorCentavos",
      rotulo: "Valor",
      valor: formatBRL(n.valorCentavos / 100),
    });
  }

  return linhas;
}
