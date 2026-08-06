"use client";

import { History } from "lucide-react";
import { useEffect, useState } from "react";

import { listarHistoricoOdontogramaAction } from "@/actions/odontograma";
import { IlustracaoTipoDente } from "@/components/odontograma/IlustracaoTipoDente";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ROTULOS_ESTADO,
  ROTULOS_FACE,
  ROTULOS_TIPO_DENTE,
  tipoDentePorFdi,
} from "@/lib/odontograma/estados";
import type { EventoOdontogramaDTO } from "@/lib/odontograma/types";

type HistoricoDenteModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prontuarioId: string;
  numeroDente: number;
  /** Espelha ausente_extraido na ilustração decorativa do cabeçalho. */
  ausente?: boolean;
};

const formatadorData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

type EstadoHistorico =
  | { tipo: "carregando" }
  | { tipo: "erro"; mensagem: string }
  | { tipo: "ok"; eventos: EventoOdontogramaDTO[] };

export function HistoricoDenteModal({
  open,
  onOpenChange,
  prontuarioId,
  numeroDente,
  ausente = false,
}: HistoricoDenteModalProps) {
  const [estado, setEstado] = useState<EstadoHistorico>({ tipo: "carregando" });
  const tipoAnatomico = tipoDentePorFdi(numeroDente);

  useEffect(() => {
    if (!open) return;

    let cancelado = false;

    void (async () => {
      const result = await listarHistoricoOdontogramaAction({
        prontuarioId,
        numeroDente,
      });
      if (cancelado) return;

      if (result.serverError || !result.data) {
        setEstado({
          tipo: "erro",
          mensagem:
            result.serverError?.mensagem ??
            "Não foi possível carregar o histórico.",
        });
        return;
      }

      setEstado({ tipo: "ok", eventos: result.data });
    })();

    return () => {
      cancelado = true;
    };
  }, [open, prontuarioId, numeroDente]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-start gap-4 pr-6">
            <IlustracaoTipoDente
              numeroDente={numeroDente}
              ausente={ausente}
            />
            <div className="min-w-0 flex-1 space-y-1.5 pt-0.5">
              <DialogTitle className="flex flex-wrap items-center gap-2">
                <History
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <span>
                  Histórico do dente{" "}
                  <span className="tabular-nums">{numeroDente}</span>
                </span>
              </DialogTitle>
              <DialogDescription>
                {ROTULOS_TIPO_DENTE[tipoAnatomico]} · linha do tempo de mudanças
                (mais recente primeiro).
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {estado.tipo === "carregando" ? (
          <div className="space-y-3" aria-busy="true">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : null}

        {estado.tipo === "erro" ? (
          <p className="text-sm text-destructive" role="alert">
            {estado.mensagem}
          </p>
        ) : null}

        {estado.tipo === "ok" && estado.eventos.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
            <p className="text-sm font-medium text-foreground">
              Nenhum evento neste dente
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Alterações de face ou de nível do dente aparecerão aqui.
            </p>
          </div>
        ) : null}

        {estado.tipo === "ok" && estado.eventos.length > 0 ? (
          <ol className="space-y-3">
            {estado.eventos.map((ev) => (
              <li
                key={ev.id}
                className="rounded-lg border border-border bg-card px-3 py-2.5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {ev.nivel === "dente" ? (
                      <>Nível do dente · {ROTULOS_ESTADO[ev.estadoNovo]}</>
                    ) : (
                      <>
                        {ev.face ? ROTULOS_FACE[ev.face] : "Face"} ·{" "}
                        {ROTULOS_ESTADO[ev.estadoNovo]}
                      </>
                    )}
                  </p>
                  <time
                    className="text-[13px] tabular-nums text-muted-foreground"
                    dateTime={ev.registradoEmIso}
                  >
                    {formatadorData.format(new Date(ev.registradoEmIso))}
                  </time>
                </div>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {ev.profissionalNome}
                </p>
              </li>
            ))}
          </ol>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
