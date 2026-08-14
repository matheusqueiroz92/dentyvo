import { CanaisSuporte } from "@/components/contato/CanaisSuporte";
import { ContatoForm } from "@/components/contato/ContatoForm";
import { FaqAccordion } from "@/components/contato/FaqAccordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FAQS_APP } from "@/lib/ajuda/faq";

type AjudaPageClientProps = {
  usuarioNome: string;
};

export function AjudaPageClient({ usuarioNome }: AjudaPageClientProps) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Ajuda e suporte
        </h1>
        <p className="mt-1 text-sm leading-[22px] text-muted-foreground">
          Perguntas frequentes e canais para falar com a Dentyvo.
        </p>
      </header>

      <section aria-labelledby="canais-ajuda-heading" className="space-y-3">
        <h2
          id="canais-ajuda-heading"
          className="text-base font-semibold text-foreground"
        >
          Canais de atendimento
        </h2>
        <CanaisSuporte />
      </section>

      <section aria-labelledby="faq-ajuda-heading" className="space-y-3">
        <h2
          id="faq-ajuda-heading"
          className="text-base font-semibold text-foreground"
        >
          Perguntas frequentes
        </h2>
        <FaqAccordion items={FAQS_APP} idPrefix="ajuda-faq" />
      </section>

      <section aria-labelledby="contato-ajuda-heading">
        <Card>
          <CardHeader>
            <CardTitle>
              <h2
                id="contato-ajuda-heading"
                className="text-xl leading-7 font-semibold tracking-tight"
              >
                Relatar problema ou tirar dúvida
              </h2>
            </CardTitle>
            <CardDescription>
              Marque como bug ou dúvida. O envio usa o mesmo canal de e-mail da
              página de contato.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ContatoForm variante="suporte" nomePadrao={usuarioNome} />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
