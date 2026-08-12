"use client";

import { History } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ROTULOS_TIPO_PERIOGRAMA } from "@/lib/periograma/helpers";
import type { PeriogramaListaDTO } from "@/lib/periograma/types";
import { cn } from "@/lib/utils";

const formatadorData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

type PeriogramaHistoricoProps = {
  periogramas: PeriogramaListaDTO[];
  selecionadoId: string | null;
  onSelecionar: (item: PeriogramaListaDTO) => void;
  carregandoDetalhe?: boolean;
};

/**
 * Lista exames do prontuário (mais recente primeiro).
 * Clique abre a grade em modo somente leitura.
 */
export function PeriogramaHistorico({
  periogramas,
  selecionadoId,
  onSelecionar,
  carregandoDetalhe = false,
}: PeriogramaHistoricoProps) {
  if (periogramas.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center">
        <p className="text-sm font-medium text-foreground">
          Nenhum periograma registrado
        </p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Inicie um exame periodontal para registrar a primeira avaliação.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-3" aria-labelledby="periograma-historico-titulo">
      <div className="flex items-center gap-2">
        <History className="size-4 text-muted-foreground" aria-hidden />
        <h3
          id="periograma-historico-titulo"
          className="text-sm font-semibold text-foreground"
        >
          Histórico de exames
        </h3>
      </div>
      <ul className="divide-y divide-border rounded-lg border border-border">
        {periogramas.map((p) => {
          const ativo = selecionadoId === p.id;
          return (
            <li key={p.id}>
              <Button
                type="button"
                variant="ghost"
                className={cn(
                  "h-auto min-h-11 w-full justify-start rounded-none px-4 py-3 text-left",
                  ativo && "bg-muted",
                )}
                disabled={carregandoDetalhe && ativo}
                onClick={() => onSelecionar(p)}
                aria-current={ativo ? "true" : undefined}
              >
                <span className="flex w-full flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
                  <span className="text-sm font-medium text-foreground">
                    {ROTULOS_TIPO_PERIOGRAMA[p.tipo]}
                    <span className="ml-2 text-[13px] font-normal text-muted-foreground">
                      · {p.quantidadeDentes}{" "}
                      {p.quantidadeDentes === 1 ? "dente" : "dentes"}
                    </span>
                  </span>
                  <span className="text-[13px] text-muted-foreground">
                    <span className="tabular-nums">
                      {formatadorData.format(new Date(p.registradoEmIso))}
                    </span>
                    {" · "}
                    {p.profissionalNome}
                  </span>
                </span>
              </Button>
            </li>
          );
        })}
      </ul>
      <p className="text-[13px] text-muted-foreground">
        Exames anteriores são somente leitura. Correção ou acompanhamento exige
        um novo exame (reavaliação).
      </p>
    </section>
  );
}
