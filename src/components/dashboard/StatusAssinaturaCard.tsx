"use client";

import { CreditCard, Sparkles } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  ResultadoBloco,
  StatusAssinaturaDashboardDTO,
} from "@/lib/dashboard/types";

import { BlocoErro } from "./BlocoErro";
import { diasRestantesAte, formatarDataCurta } from "./formatacao";

const ROTULO_MOTIVO: Record<StatusAssinaturaDashboardDTO["motivo"], string> = {
  trialing: "Período de trial",
  ativa: "Assinatura ativa",
  acesso_manual: "Acesso liberado",
  inadimplente: "Pagamento pendente",
  cancelada: "Assinatura cancelada",
  sem_assinatura: "Sem assinatura",
};

export function StatusAssinaturaCard({
  resultado,
}: {
  resultado: ResultadoBloco<StatusAssinaturaDashboardDTO>;
}) {
  const [toast, setToast] = useState<string | null>(null);

  if (!resultado.ok) {
    return (
      <BlocoErro title="Status da assinatura" mensagem={resultado.mensagem} />
    );
  }

  const { motivo, permitido, ateDataIso } = resultado.data;
  const emTrial = motivo === "trialing";
  const dias =
    emTrial && ateDataIso != null ? diasRestantesAte(ateDataIso) : null;

  return (
    <Card className={emTrial ? "border-primary/25" : undefined}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {emTrial ? (
            <Sparkles className="size-5 text-primary" aria-hidden />
          ) : (
            <CreditCard className="size-5 text-muted-foreground" aria-hidden />
          )}
          Status da assinatura
        </CardTitle>
        <CardDescription>{ROTULO_MOTIVO[motivo]}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {emTrial && dias != null ? (
          <p>
            <span className="font-semibold tabular-nums text-foreground">
              {dias}
            </span>{" "}
            {dias === 1 ? "dia restante" : "dias restantes"}
            {ateDataIso ? (
              <span className="text-muted-foreground">
                {" "}
                (até {formatarDataCurta(ateDataIso)})
              </span>
            ) : null}
          </p>
        ) : (
          <p className="text-muted-foreground">
            Acesso operacional:{" "}
            <span className="font-medium text-foreground">
              {permitido ? "liberado" : "bloqueado para escrita"}
            </span>
          </p>
        )}
        {toast ? (
          <p role="status" className="text-[13px] text-muted-foreground">
            {toast}
          </p>
        ) : null}
      </CardContent>
      {emTrial || !permitido ? (
        <CardFooter>
          <Button
            type="button"
            variant="primary"
            className="min-h-11 w-full sm:w-auto"
            onClick={() => {
              setToast("Assinatura em breve.");
              window.setTimeout(() => setToast(null), 4000);
            }}
          >
            Assinar agora
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}
