"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { marcarConsultaAction } from "@/actions/agendamento";
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
import type { AgendamentoAgendaDTO, OpcaoSelect } from "@/lib/agenda/types";

const schema = z.object({
  pacienteId: z.string().uuid("Selecione o paciente."),
  profissionalId: z.string().uuid("Selecione o profissional."),
  procedimentoId: z.string().uuid("Selecione o procedimento."),
  dataHoraInicioLocal: z.string().min(1, "Informe data e horário."),
});

type FormValues = z.infer<typeof schema>;

type NovoAgendamentoModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacientes: OpcaoSelect[];
  profissionais: OpcaoSelect[];
  procedimentos: OpcaoSelect[];
  defaults?: {
    profissionalId?: string;
    dataHoraInicioIso?: string;
  };
  onCriado: (agendamento: AgendamentoAgendaDTO) => void;
};

function isoParaLocalInput(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  // datetime-local no fuso do browser — ok para UX operacional
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function NovoAgendamentoModal({
  open,
  onOpenChange,
  pacientes,
  profissionais,
  procedimentos,
  defaults,
  onCriado,
}: NovoAgendamentoModalProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      pacienteId: "",
      profissionalId: defaults?.profissionalId ?? "",
      procedimentoId: "",
      dataHoraInicioLocal: isoParaLocalInput(defaults?.dataHoraInicioIso),
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        pacienteId: "",
        profissionalId: defaults?.profissionalId ?? profissionais[0]?.id ?? "",
        procedimentoId: procedimentos[0]?.id ?? "",
        dataHoraInicioLocal: isoParaLocalInput(defaults?.dataHoraInicioIso),
      });
    }
  }, [open, defaults, profissionais, procedimentos, form]);

  async function onSubmit(values: FormValues) {
    const result = await marcarConsultaAction({
      pacienteId: values.pacienteId,
      profissionalId: values.profissionalId,
      procedimentoId: values.procedimentoId,
      dataHoraInicioIso: new Date(values.dataHoraInicioLocal).toISOString(),
    });

    if (result.serverError || !result.data) {
      toast.error(
        result.serverError?.mensagem ?? "Não foi possível marcar a consulta.",
      );
      return;
    }

    toast.success("Consulta marcada.");
    onCriado(result.data);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Nova consulta</DialogTitle>
          <DialogDescription>
            Preencha os dados para marcar o horário na agenda.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="pacienteId">Paciente</Label>
            <select
              id="pacienteId"
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              {...form.register("pacienteId")}
            >
              <option value="">Selecione…</option>
              {pacientes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            {form.formState.errors.pacienteId ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.pacienteId.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="profissionalId">Profissional</Label>
            <select
              id="profissionalId"
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              {...form.register("profissionalId")}
            >
              <option value="">Selecione…</option>
              {profissionais.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            {form.formState.errors.profissionalId ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.profissionalId.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="procedimentoId">Procedimento</Label>
            <select
              id="procedimentoId"
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              {...form.register("procedimentoId")}
            >
              <option value="">Selecione…</option>
              {procedimentos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            {form.formState.errors.procedimentoId ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.procedimentoId.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dataHoraInicioLocal">Data e horário</Label>
            <Input
              id="dataHoraInicioLocal"
              type="datetime-local"
              className="tabular-nums"
              {...form.register("dataHoraInicioLocal")}
            />
            {form.formState.errors.dataHoraInicioLocal ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.dataHoraInicioLocal.message}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Salvando…" : "Marcar consulta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
