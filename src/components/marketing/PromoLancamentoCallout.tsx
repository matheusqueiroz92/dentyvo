import { Badge } from "@/components/ui/badge";
import {
  DURACAO_PROMOCAO_LANCAMENTO_MESES,
  LIMITE_VAGAS_PROMOCIONAIS_LANCAMENTO,
  PRECO_PROMOCIONAL_CENTAVOS,
} from "@/core/assinatura/domain/constants";
import { formatBRL } from "@/lib/design-tokens";

function formatPrecoPromocional(centavos: number): string {
  return formatBRL(centavos / 100).replace(",00", "");
}

/** Indicador de escassez da promoção de lançamento (30 vagas). */
export function PromoLancamentoCallout({ className }: { className?: string }) {
  return (
    <div
      role="status"
      className={
        className ??
        "flex flex-col gap-2 rounded-[var(--radius-lg)] border border-[hsl(var(--warning)/0.35)] bg-[hsl(var(--warning-subtle))] px-4 py-4 text-left sm:flex-row sm:items-start sm:gap-3 sm:px-5"
      }
    >
      <Badge
        variant="warning"
        className="w-fit shrink-0 normal-case tracking-normal"
      >
        Lançamento
      </Badge>
      <p className="text-sm leading-[22px] text-[hsl(var(--warning-subtle-foreground))]">
        As {LIMITE_VAGAS_PROMOCIONAIS_LANCAMENTO} primeiras clínicas pagam{" "}
        <span className="numeric font-semibold">
          {formatPrecoPromocional(PRECO_PROMOCIONAL_CENTAVOS.basico)}/mês
        </span>{" "}
        no Básico e{" "}
        <span className="numeric font-semibold">
          {formatPrecoPromocional(PRECO_PROMOCIONAL_CENTAVOS.medio)}/mês
        </span>{" "}
        no Médio por {DURACAO_PROMOCAO_LANCAMENTO_MESES} meses. Depois, o plano
        migra automaticamente para o preço cheio.
      </p>
    </div>
  );
}
