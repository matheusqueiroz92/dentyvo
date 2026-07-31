import { Construction } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";

type EmConstrucaoProps = {
  titulo: string;
  descricao?: string;
};

/** Placeholder para rotas planejadas ainda sem feature. */
export function EmConstrucao({
  titulo,
  descricao = "Esta tela ainda está em construção. Em breve.",
}: EmConstrucaoProps) {
  return (
    <main className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl leading-[38px] font-bold tracking-tight">
          {titulo}
        </h1>
      </header>
      <div className="rounded-lg border border-border bg-card">
        <EmptyState
          icon={Construction}
          title="Em construção"
          description={descricao}
          className="py-16"
        />
      </div>
    </main>
  );
}
