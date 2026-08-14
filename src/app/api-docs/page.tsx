import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FileText } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { apiDocsLiberado, getApiDocs } from "@/lib/swagger";

import { ReactSwagger } from "./react-swagger";

export const metadata: Metadata = {
  title: "Documentação da API — Dentyvo",
  robots: { index: false, follow: false },
};

export default async function ApiDocsPage() {
  if (!apiDocsLiberado()) {
    notFound();
  }

  let spec: Awaited<ReturnType<typeof getApiDocs>>;
  try {
    spec = await getApiDocs();
  } catch (erro) {
    console.error("[api-docs] falha ao gerar spec OpenAPI", erro);
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          icon={FileText}
          title="Não foi possível gerar a documentação"
          description="Tente recarregar a página. Se o problema continuar, verifique os comentários @swagger nas rotas."
        />
      </main>
    );
  }

  const temPaths = Object.keys(spec.paths ?? {}).length > 0;
  if (!temPaths) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          icon={FileText}
          title="Nenhuma rota documentada"
          description="A spec OpenAPI foi gerada, mas ainda não há paths com comentários @swagger."
        />
      </main>
    );
  }

  return (
    <main className="min-h-full bg-background text-foreground">
      <h1 className="sr-only">Documentação da API Dentyvo</h1>
      <ReactSwagger spec={spec} />
    </main>
  );
}
