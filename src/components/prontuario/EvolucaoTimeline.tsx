"use client";

import { CornerDownRight, NotebookPen } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { montarTimelineEvolucoes } from "@/lib/prontuario/mapear";
import type { EvolucaoDTO } from "@/lib/prontuario/types";

type EvolucaoTimelineProps = {
  evolucoes: EvolucaoDTO[];
  onNova: () => void;
  onRetificar: (evolucao: EvolucaoDTO) => void;
};

const formatadorData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export function EvolucaoTimeline({
  evolucoes,
  onNova,
  onRetificar,
}: EvolucaoTimelineProps) {
  const itens = montarTimelineEvolucoes(evolucoes);

  return (
    <section className="space-y-4" aria-labelledby="evolucoes-titulo">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <NotebookPen className="size-4 text-muted-foreground" aria-hidden />
          <h2
            id="evolucoes-titulo"
            className="text-base font-semibold text-foreground"
          >
            Evoluções
          </h2>
        </div>
        <Button type="button" className="min-h-11" onClick={onNova}>
          Nova evolução
        </Button>
      </div>

      {itens.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
          <p className="text-sm font-medium text-foreground">
            Nenhuma evolução registrada
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Registre o atendimento clínico para montar o histórico do paciente.
          </p>
        </div>
      ) : (
        <ol className="space-y-4">
          {itens.map(({ registro, retificacao }) => (
            <li key={registro.id} className="space-y-2">
              <EvolucaoCard
                evolucao={registro}
                podeRetificar={!registro.jaRetificada}
                onRetificar={() => onRetificar(registro)}
              />
              {retificacao ? (
                <div className="relative ml-3 border-l-2 border-border pl-4 sm:ml-5">
                  <div className="mb-2 flex items-center gap-1.5 text-[13px] text-muted-foreground">
                    <CornerDownRight className="size-3.5 shrink-0" aria-hidden />
                    <span>
                      Retifica a entrada de{" "}
                      <span className="tabular-nums">
                        {formatadorData.format(
                          new Date(registro.registradoEmIso),
                        )}
                      </span>
                    </span>
                  </div>
                  <EvolucaoCard evolucao={retificacao} />
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function EvolucaoCard({
  evolucao,
  podeRetificar,
  onRetificar,
}: {
  evolucao: EvolucaoDTO;
  podeRetificar?: boolean;
  onRetificar?: () => void;
}) {
  const ehRegistro = evolucao.tipo === "registro";

  return (
    <article className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={ehRegistro ? "info" : "warning"}>
              {ehRegistro ? "Registro" : "Retificação"}
            </Badge>
            {ehRegistro && evolucao.jaRetificada ? (
              <Badge variant="outline">Retificada</Badge>
            ) : null}
            <span className="text-[13px] tabular-nums text-muted-foreground">
              {formatadorData.format(new Date(evolucao.registradoEmIso))}
            </span>
          </div>
          <p className="text-[13px] text-muted-foreground">
            {evolucao.profissionalNome}
            {evolucao.procedimentoNome
              ? ` · ${evolucao.procedimentoNome}`
              : null}
          </p>
        </div>

        {ehRegistro && podeRetificar && onRetificar ? (
          <Button
            type="button"
            variant="outline"
            className="min-h-11 shrink-0"
            onClick={onRetificar}
          >
            Retificar
          </Button>
        ) : null}
      </div>

      <p className="whitespace-pre-wrap text-sm text-foreground">
        {evolucao.descricao}
      </p>

      {evolucao.motivoRetificacao ? (
        <p className="rounded-md bg-muted/50 px-3 py-2 text-[13px] text-muted-foreground">
          <span className="font-medium text-foreground">Motivo: </span>
          {evolucao.motivoRetificacao}
        </p>
      ) : null}
    </article>
  );
}
