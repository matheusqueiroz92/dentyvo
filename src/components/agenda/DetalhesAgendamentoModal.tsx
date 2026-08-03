"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  cancelarConsultaAction,
  confirmarConsultaAction,
  remarcarConsultaAction,
} from "@/actions/agendamento";
import { StatusAgendamentoBadge } from "@/components/domain/StatusAgendamentoBadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatarHora } from "@/lib/agenda/periodo";
import type {
  AgendaPermissoes,
  AgendamentoAgendaDTO,
} from "@/lib/agenda/types";

type DetalhesAgendamentoModalProps = {
  agendamento: AgendamentoAgendaDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permissoes: AgendaPermissoes;
  onAtualizado: (agendamento: AgendamentoAgendaDTO) => void;
  onRemovido: (id: string) => void;
};

function isoParaLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function DetalhesAgendamentoModal({
  agendamento,
  open,
  onOpenChange,
  permissoes,
  onAtualizado,
  onRemovido,
}: DetalhesAgendamentoModalProps) {
  const [confirmCancelar, setConfirmCancelar] = useState(false);
  const [modoRemarcar, setModoRemarcar] = useState(false);
  const [novaDataLocal, setNovaDataLocal] = useState("");
  const [busy, setBusy] = useState(false);

  if (!agendamento) return null;

  const podeConfirmar =
    permissoes.confirmar && agendamento.status === "pendente";
  const podeCancelar =
    permissoes.cancelar &&
    (agendamento.status === "pendente" ||
      agendamento.status === "confirmado");
  const podeRemarcar =
    permissoes.remarcar &&
    (agendamento.status === "pendente" ||
      agendamento.status === "confirmado");

  async function handleConfirmar() {
    setBusy(true);
    try {
      const result = await confirmarConsultaAction({
        agendamentoId: agendamento!.id,
      });
      if (result.serverError || !result.data) {
        toast.error(
          result.serverError?.mensagem ?? "Não foi possível confirmar.",
        );
        return;
      }
      toast.success("Consulta confirmada.");
      onAtualizado(result.data);
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  async function handleCancelar() {
    setBusy(true);
    try {
      const result = await cancelarConsultaAction({
        agendamentoId: agendamento!.id,
      });
      if (result.serverError) {
        toast.error(
          result.serverError.mensagem ?? "Não foi possível cancelar.",
        );
        return;
      }
      toast.success("Consulta cancelada.");
      onRemovido(agendamento!.id);
      setConfirmCancelar(false);
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  async function handleRemarcar() {
    if (!novaDataLocal) return;
    setBusy(true);
    try {
      const result = await remarcarConsultaAction({
        agendamentoId: agendamento!.id,
        novaDataHoraInicioIso: new Date(novaDataLocal).toISOString(),
      });
      if (result.serverError || !result.data) {
        toast.error(
          result.serverError?.mensagem ?? "Não foi possível remarcar.",
        );
        return;
      }
      toast.success("Consulta remarcada.");
      onAtualizado(result.data);
      setModoRemarcar(false);
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) {
            setModoRemarcar(false);
          }
          onOpenChange(v);
        }}
      >
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Detalhes da consulta</DialogTitle>
            <DialogDescription>
              {formatarHora(agendamento.dataHoraInicioIso)} –{" "}
              {formatarHora(agendamento.dataHoraFimIso)}
            </DialogDescription>
          </DialogHeader>

          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Paciente</dt>
              <dd className="font-medium text-foreground">
                {agendamento.pacienteNome}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Profissional</dt>
              <dd className="font-medium text-foreground">
                {agendamento.profissionalNome}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Procedimento</dt>
              <dd className="font-medium text-foreground">
                {agendamento.procedimentoNome}
              </dd>
            </div>
            <div>
              <dt className="mb-1 text-muted-foreground">Status</dt>
              <dd>
                <StatusAgendamentoBadge status={agendamento.status} />
              </dd>
            </div>
          </dl>

          {modoRemarcar ? (
            <div className="space-y-2 border-t border-border pt-4">
              <Label htmlFor="nova-data">Novo horário</Label>
              <Input
                id="nova-data"
                type="datetime-local"
                className="tabular-nums"
                value={novaDataLocal || isoParaLocalInput(agendamento.dataHoraInicioIso)}
                onChange={(e) => setNovaDataLocal(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModoRemarcar(false)}
                >
                  Voltar
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  disabled={busy}
                  onClick={() => void handleRemarcar()}
                >
                  Salvar remarcação
                </Button>
              </div>
            </div>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-2">
            {podeCancelar ? (
              <Button
                type="button"
                variant="danger"
                disabled={busy}
                onClick={() => setConfirmCancelar(true)}
              >
                Cancelar consulta
              </Button>
            ) : null}
            {podeRemarcar && !modoRemarcar ? (
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => {
                  setNovaDataLocal(
                    isoParaLocalInput(agendamento.dataHoraInicioIso),
                  );
                  setModoRemarcar(true);
                }}
              >
                Remarcar
              </Button>
            ) : null}
            {podeConfirmar ? (
              <Button
                type="button"
                variant="primary"
                disabled={busy}
                onClick={() => void handleConfirmar()}
              >
                Confirmar
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmCancelar} onOpenChange={setConfirmCancelar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar esta consulta?</AlertDialogTitle>
            <AlertDialogDescription>
              O horário será liberado na agenda. Esta ação não pode ser
              desfeita pelo fluxo atual.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter consulta</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                void handleCancelar();
              }}
            >
              Confirmar cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
