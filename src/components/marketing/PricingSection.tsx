import { SectionReveal } from "@/components/marketing/SectionReveal";
import { PromoLancamentoCallout } from "@/components/marketing/PromoLancamentoCallout";
import { PricingCard } from "@/components/ui/PricingCard";
import { PLANOS_MARKETING } from "@/lib/cadastro/planos";

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

        <div className="mx-auto mt-8 max-w-3xl">
          <PromoLancamentoCallout />
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3 lg:items-stretch">
          {PLANOS_MARKETING.map((plano) => (
            <PricingCard
              key={plano.id}
              nome={plano.nome}
              descricao={plano.descricao}
              precoMinMensal={plano.precoMinMensal}
              precoMaxMensal={plano.precoMaxMensal}
              precoPromocionalMensal={plano.precoPromocionalMensal}
              recursos={[...plano.recursos]}
              ctaLabel="Começar agora"
              ctaHref={`/cadastro?plano=${plano.slug}`}
              destaque={plano.destaque}
              badge={plano.badge}
            />
          ))}
        </div>
      </div>
    </SectionReveal>
  );
}
