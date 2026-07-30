import {
  ArrowRight,
  CalendarDays,
  ClipboardPlus,
  FileSpreadsheet,
  FolderOpen,
  MessageCircle,
  PenLine,
  ScanLine,
  Sparkles,
  WalletCards,
} from "lucide-react";

import { PricingCard } from "@/components/marketing/PricingCard";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DURACAO_PROMOCAO_LANCAMENTO_MESES,
  LIMITE_VAGAS_PROMOCIONAIS_LANCAMENTO,
  PRECO_PROMOCIONAL_CENTAVOS,
} from "@/core/assinatura/domain/constants";
import { formatBRL } from "@/lib/design-tokens";

const features = [
  {
    title: "Agendamento inteligente",
    description:
      "Organize a agenda da clínica sem overbooking. Confirmações e remarcações ficam claras para a equipe.",
    icon: CalendarDays,
  },
  {
    title: "Prontuário digital completo",
    description:
      "Anamnese, evoluções, odontograma e periograma no mesmo lugar — sem pasta física nem retrabalho.",
    icon: ScanLine,
  },
  {
    title: "Secretária virtual via WhatsApp",
    description:
      "Um bot que responde pacientes, confirma consultas e reduz a fila de mensagens na recepção.",
    icon: MessageCircle,
  },
  {
    title: "Assinatura simples com PIX",
    description:
      "Comece com trial, assine pelo PIX e acompanhe o status da assinatura sem burocracia de plataforma grande.",
    icon: WalletCards,
  },
] as const;

const planos = [
  {
    nome: "Básico",
    descricao: "Essencial para organizar agenda e prontuário.",
    precoMinMensal: 79,
    precoMaxMensal: 99,
    precoPromocionalMensal: PRECO_PROMOCIONAL_CENTAVOS.basico / 100,
    recursos: [
      "Agendamento",
      "Prontuário",
      "Anamnese",
      "Receituário",
    ],
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

export default function LandingPage() {
  return (
    <main>
      {/* 1. Hero */}
      <section
        aria-labelledby="hero-heading"
        className="relative overflow-hidden border-b border-border"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--brand-cyan-500)/0.14),transparent_55%),radial-gradient(ellipse_at_bottom_left,hsl(var(--brand-blue-600)/0.12),transparent_50%)]"
        />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:px-8 lg:py-24">
          <div>
            <p className="brand-gradient-text text-sm font-semibold tracking-wide uppercase">
              Dentyvo
            </p>
            <h1
              id="hero-heading"
              className="mt-4 max-w-2xl text-3xl leading-tight font-bold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]"
            >
              Sua clínica nunca mais deixa um paciente sem resposta.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              Agendamento, prontuário e uma secretária virtual no WhatsApp que
              atende por você — mesmo quando não há ninguém na recepção.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <ButtonLink
                href="/cadastro"
                variant="primary"
                size="lg"
                className="min-h-11"
              >
                Começar agora
                <ArrowRight aria-hidden strokeWidth={2} />
              </ButtonLink>
              <ButtonLink
                href="#planos"
                variant="outline"
                size="lg"
                className="min-h-11"
              >
                Ver planos
              </ButtonLink>
            </div>
          </div>

          <div
            aria-hidden
            className="relative mx-auto w-full max-w-md rounded-[var(--radius-xl)] border border-border bg-card p-5 shadow-[var(--shadow-md)] lg:mx-0"
          >
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="brand-gradient flex size-10 items-center justify-center rounded-[var(--radius-md)] text-primary-foreground">
                <Sparkles className="size-5" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-sm font-semibold">Secretária virtual</p>
                <p className="text-xs text-muted-foreground">WhatsApp · online agora</p>
              </div>
              <Badge variant="success" className="ml-auto normal-case tracking-normal">
                Ativa
              </Badge>
            </div>
            <div className="mt-4 space-y-3">
              <div className="rounded-[var(--radius-md)] bg-muted px-3 py-2.5 text-sm text-muted-foreground">
                Olá! Quero remarcar minha consulta de amanhã.
              </div>
              <div className="ml-6 rounded-[var(--radius-md)] bg-[hsl(var(--info-subtle))] px-3 py-2.5 text-sm text-[hsl(var(--info-subtle-foreground))]">
                Claro. Tenho horários às{" "}
                <span className="numeric font-medium">14:30</span> e{" "}
                <span className="numeric font-medium">16:00</span>. Qual prefere?
              </div>
              <div className="rounded-[var(--radius-md)] bg-muted px-3 py-2.5 text-sm text-muted-foreground">
                16:00, por favor.
              </div>
              <div className="ml-6 rounded-[var(--radius-md)] bg-[hsl(var(--success-subtle))] px-3 py-2.5 text-sm text-[hsl(var(--success-subtle-foreground))]">
                Pronto — consulta remarcada e confirmada na agenda.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. O problema */}
      <section
        id="problema"
        aria-labelledby="problema-heading"
        className="scroll-mt-20 border-b border-border bg-card"
      >
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold tracking-wide text-primary uppercase">
              O problema
            </p>
            <h2
              id="problema-heading"
              className="mt-3 text-2xl leading-8 font-bold tracking-tight sm:text-3xl sm:leading-9"
            >
              Papel, planilha, retrabalho. Você conhece bem.
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Muitas clínicas ainda perdem tempo precioso preenchendo anamnese
              à mão, procurando prontuário em pasta física, ou tentando lembrar
              quem confirmou a consulta de amanhã. A Dentyvo resolve isso.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="rounded-[var(--radius-lg)] border border-border bg-background p-6">
              <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <PenLine className="size-[18px]" aria-hidden strokeWidth={1.75} />
                Antes
              </p>
              <ul className="mt-4 space-y-4">
                <li className="flex gap-3 text-sm leading-[22px]">
                  <FileSpreadsheet
                    className="mt-0.5 size-[18px] shrink-0 text-warning"
                    aria-hidden
                    strokeWidth={1.75}
                  />
                  <span>Anamnese em papel ou planilha, fácil de perder.</span>
                </li>
                <li className="flex gap-3 text-sm leading-[22px]">
                  <FolderOpen
                    className="mt-0.5 size-[18px] shrink-0 text-warning"
                    aria-hidden
                    strokeWidth={1.75}
                  />
                  <span>Prontuário em pasta física, difícil de achar na hora.</span>
                </li>
                <li className="flex gap-3 text-sm leading-[22px]">
                  <MessageCircle
                    className="mt-0.5 size-[18px] shrink-0 text-warning"
                    aria-hidden
                    strokeWidth={1.75}
                  />
                  <span>WhatsApp da clínica parado quando a recepção está ocupada.</span>
                </li>
              </ul>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-primary/25 bg-[hsl(var(--info-subtle))] p-6">
              <p className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--info-subtle-foreground))]">
                <Sparkles className="size-[18px]" aria-hidden strokeWidth={1.75} />
                Com a Dentyvo
              </p>
              <ul className="mt-4 space-y-4">
                <li className="flex gap-3 text-sm leading-[22px] text-foreground">
                  <ClipboardPlus
                    className="mt-0.5 size-[18px] shrink-0 text-success"
                    aria-hidden
                    strokeWidth={1.75}
                  />
                  <span>Anamnese e prontuário digitais, sempre à mão.</span>
                </li>
                <li className="flex gap-3 text-sm leading-[22px] text-foreground">
                  <CalendarDays
                    className="mt-0.5 size-[18px] shrink-0 text-success"
                    aria-hidden
                    strokeWidth={1.75}
                  />
                  <span>Agenda com confirmações visíveis para toda a equipe.</span>
                </li>
                <li className="flex gap-3 text-sm leading-[22px] text-foreground">
                  <MessageCircle
                    className="mt-0.5 size-[18px] shrink-0 text-success"
                    aria-hidden
                    strokeWidth={1.75}
                  />
                  <span>Secretária virtual que responde mesmo fora do horário de pico.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Features */}
      <section
        id="recursos"
        aria-labelledby="recursos-heading"
        className="scroll-mt-20 border-b border-border"
      >
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold tracking-wide text-primary uppercase">
              Recursos
            </p>
            <h2
              id="recursos-heading"
              className="mt-3 text-2xl leading-8 font-bold tracking-tight sm:text-3xl"
            >
              Tudo que a clínica precisa no dia a dia
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Do primeiro contato no WhatsApp até o prontuário completo — sem
              espalhar a operação em ferramentas desconectadas.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="h-full shadow-[var(--shadow-sm)]">
                  <CardHeader>
                    <div className="brand-gradient mb-2 flex size-10 items-center justify-center rounded-[var(--radius-md)] text-primary-foreground">
                      <Icon className="size-5" aria-hidden strokeWidth={1.75} />
                    </div>
                    <CardTitle className="text-lg leading-7">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-[22px] text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Planos */}
      <section
        id="planos"
        aria-labelledby="planos-heading"
        className="scroll-mt-20 border-b border-border bg-muted/40"
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
              Feita para o tamanho real da sua clínica — não para redes
              gigantes.
            </p>
          </div>

          <div
            role="status"
            className="mx-auto mt-8 flex max-w-3xl flex-col gap-2 rounded-[var(--radius-lg)] border border-[hsl(var(--warning)/0.35)] bg-[hsl(var(--warning-subtle))] px-4 py-4 text-left sm:flex-row sm:items-start sm:gap-3 sm:px-5"
          >
            <Badge variant="warning" className="w-fit shrink-0 normal-case tracking-normal">
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
      </section>
    </main>
  );
}
