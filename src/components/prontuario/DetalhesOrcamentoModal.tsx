"use client";

import { CalendarPlus, Download } from "lucide-react";

import { StatusOrcamentoBadge } from "@/components/domain/StatusOrcamentoBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { OrcamentoListaDTO } from "@/lib/orcamento/types";

const formatadorData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

const formatadorDataCivil = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeZone: "UTC",
});

const formatadorMoeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

type DetalhesOrcamentoModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orcamento: OrcamentoListaDTO | null;
  decidindo: boolean;
  baixandoPdf: boolean;
  onAceitar: () => void;
  onRecusar: () => void;
  onBaixarPdf: () => void;
  onAgendarItem: (procedimentoId: string) => void;
};

export function DetalhesOrcamentoModal({
  open,
  onOpenChange,
  orcamento,
  decidindo,
  baixandoPdf,
  onAceitar,
  onRecusar,
  onBaixarPdf,
  onAgendarItem,
}: DetalhesOrcamentoModalProps) {
  if (!orcamento) return null;

  const enviado = orcamento.status === "enviado";
  const aceito = orcamento.status === "aceito";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Detalhes do orçamento</DialogTitle>
          <DialogDescription>
            {formatadorData.format(new Date(orcamento.emitidoEmIso))} ·{" "}
            {orcamento.profissionalNome}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusOrcamentoBadge status={orcamento.status} />
            {orcamento.validoAteIso ? (
              <p className="text-[13px] tabular-nums text-muted-foreground">
                Válido até{" "}
                {formatadorDataCivil.format(
                  new Date(`${orcamento.validoAteIso}T00:00:00.000Z`),
                )}
              </p>
            ) : null}
          </div>

          <ul className="space-y-3">
            {orcamento.itens.map((item, index) => (
              <li
                key={`${item.procedimentoId}-${index}`}
                className="rounded-lg border border-border p-3"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {item.nome}
                    </p>
                    <p className="text-[13px] tabular-nums text-muted-foreground">
                      {item.quantidade} × {formatadorMoeda.format(item.valor)} ={" "}
                      {formatadorMoeda.format(item.subtotal)}
                    </p>
                  </div>
                  {aceito ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11 shrink-0"
                      onClick={() => onAgendarItem(item.procedimentoId)}
                    >
                      <CalendarPlus className="size-4" aria-hidden />
                      Agendar este procedimento
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>

          <div className="rounded-lg border border-border bg-muted/40 px-4 py-3">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-semibold tabular-nums text-foreground">
              {formatadorMoeda.format(orcamento.total)}
            </p>
          </div>

          {enviado ? (
            <Alert>
              <AlertTitle>Decisão do paciente</AlertTitle>
              <AlertDescription>
                A equipe registra aqui a decisão informada pelo paciente. O
                paciente não decide pelo sistema neste MVP.
              </AlertDescription>
            </Alert>
          ) : null}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            disabled={baixandoPdf}
            onClick={onBaixarPdf}
          >
            <Download className="size-4" aria-hidden />
            {baixandoPdf ? "Gerando…" : "Baixar PDF"}
          </Button>

          <div className="flex flex-col gap-2 sm:flex-row">
            {enviado ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  disabled={decidindo}
                  onClick={onRecusar}
                >
                  Marcar como recusado
                </Button>
                <Button
                  type="button"
                  className="min-h-11"
                  disabled={decidindo}
                  onClick={onAceitar}
                >
                  {decidindo ? "Salvando…" : "Marcar como aceito"}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                onClick={() => onOpenChange(false)}
              >
                Fechar
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
