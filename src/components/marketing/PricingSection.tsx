import { SectionReveal } from "@/components/marketing/SectionReveal";
import { Badge } from "@/components/ui/badge";
import { PricingCard } from "@/components/ui/PricingCard";
import {
  DURACAO_PROMOCAO_LANCAMENTO_MESES,
  LIMITE_VAGAS_PROMOCIONAIS_LANCAMENTO,
  PRECO_PROMOCIONAL_CENTAVOS,
} from "@/core/assinatura/domain/constants";
import { formatBRL } from "@/lib/design-tokens";

const planos = [
  {
    nome: "Básico",
    descricao: "Essencial para organizar agenda e prontuário.",
    precoMinMensal: 79,
    precoMaxMensal: 99,
    precoPromocionalMensal: PRECO_PROMOCIONAL_CENTAVOS.basico / 100,
    recursos: ["Agendamento", "Prontuário", "Anamnese", "Receituário"],
  },
  {
    nome: "Médio",
    descricao: "Tudo do Básico, com atendimento automático no WhatsApp.",
    precoMinMensal: 149,
    precoMaxMensal: 179,
    precoPromocionalMensal: PRECO_PROMOCIONAL_CENTAVOS.medio / 100,
    recursos: [
      "Tudo do plano Básico",
      "Bot de WhatsApp",
      "Confirmações e respostas automáticas",
      "Ideal para clínicas com volume no WhatsApp",
    ],
    destaque: true,
    badge: "Mais popular",
  },
  {
    nome: "Full",
    descricao: "Para clínicas que precisam de escala e suporte prioritário.",
    precoMinMensal: 249,
    precoMaxMensal: 299,
    recursos: [
      "Tudo do plano Médio",
      "Profissionais ilimitados",
      "Suporte prioritário",
      "Odontograma e periograma completos",
    ],
  },
] as const;

function formatPrecoPromocional(centavos: number): string {
  return formatBRL(centavos / 100).replace(",00", "");
}

export function PricingSection() {
  return (
    <SectionReveal
      id="planos"
      aria-labelledby="planos-heading"
      className="scroll-mt-20 border-b border-border bg-muted/40"
      duration="panel"
      yOffset={24}
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold tracking-wide text-primary uppercase">
            Planos
          </p>
          <h2
            id="planos-heading"
            className="mt-3 text-2xl leading-8 font-bold tracking-tight sm:text-3xl"
          >
            Gestão completa, sem o preço de plataforma grande.
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Feita para o tamanho real da sua clínica — não para redes gigantes.
          </p>
        </div>

        <div
          role="status"
          className="mx-auto mt-8 flex max-w-3xl flex-col gap-2 rounded-[var(--radius-lg)] border border-[hsl(var(--warning)/0.35)] bg-[hsl(var(--warning-subtle))] px-4 py-4 text-left sm:flex-row sm:items-start sm:gap-3 sm:px-5"
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
            no Médio por {DURACAO_PROMOCAO_LANCAMENTO_MESES} meses. Depois, o
            plano migra automaticamente para o preço cheio.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3 lg:items-stretch">
          {planos.map((plano) => (
            <PricingCard
              key={plano.nome}
              nome={plano.nome}
              descricao={plano.descricao}
              precoMinMensal={plano.precoMinMensal}
              precoMaxMensal={plano.precoMaxMensal}
              precoPromocionalMensal={
                "precoPromocionalMensal" in plano
                  ? plano.precoPromocionalMensal
                  : undefined
              }
              recursos={[...plano.recursos]}
              ctaLabel="Começar agora"
              ctaHref="/cadastro"
              destaque={"destaque" in plano ? plano.destaque : false}
              badge={"badge" in plano ? plano.badge : undefined}
            />
          ))}
        </div>
      </div>
    </SectionReveal>
  );
}
