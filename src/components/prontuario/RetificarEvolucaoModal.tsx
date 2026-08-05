"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  retificarEvolucaoFormSchema,
  type RetificarEvolucaoFormValues,
} from "@/lib/prontuario/schema";
import type { EvolucaoDTO } from "@/lib/prontuario/types";
import { cn } from "@/lib/utils";

type RetificarEvolucaoModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  original: EvolucaoDTO | null;
  salvando: boolean;
  onSalvar: (values: RetificarEvolucaoFormValues) => Promise<void>;
};

const formatadorData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export function RetificarEvolucaoModal({
  open,
  onOpenChange,
  original,
  salvando,
  onSalvar,
}: RetificarEvolucaoModalProps) {
  const form = useForm<RetificarEvolucaoFormValues>({
    resolver: zodResolver(retificarEvolucaoFormSchema),
    defaultValues: { descricao: "", motivoRetificacao: "" },
  });

  useEffect(() => {
    if (open && original) {
      form.reset({
        descricao: original.descricao,
        motivoRetificacao: "",
      });
    }
  }, [open, original, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px] md:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Retificar evolução</DialogTitle>
          <DialogDescription>
            Cria um novo registro ligado ao original. O texto anterior permanece
            no histórico e não pode ser apagado.
          </DialogDescription>
        </DialogHeader>

        {original ? (
          <div className="rounded-md border border-border bg-muted/40 px-3 py-3 space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Texto original (somente leitura)
            </p>
            <p className="text-[13px] text-muted-foreground tabular-nums">
              {formatadorData.format(new Date(original.registradoEmIso))} ·{" "}
              {original.profissionalNome}
            </p>
            <p className="whitespace-pre-wrap text-sm text-foreground">
              {original.descricao}
            </p>
          </div>
        ) : null}

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(onSalvar)}
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="retificacao-descricao">Nova descrição</Label>
            <textarea
              id="retificacao-descricao"
              rows={5}
              disabled={salvando}
              aria-invalid={Boolean(form.formState.errors.descricao)}
              className={cn(
                "w-full min-w-0 rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
              )}
              {...form.register("descricao")}
            />
            {form.formState.errors.descricao ? (
              <p className="text-[13px] text-destructive" role="alert">
                {form.formState.errors.descricao.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="retificacao-motivo">Motivo da retificação</Label>
            <textarea
              id="retificacao-motivo"
              rows={3}
              disabled={salvando}
              aria-invalid={Boolean(form.formState.errors.motivoRetificacao)}
              className={cn(
                "w-full min-w-0 rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
              )}
              placeholder="Explique por que esta correção é necessária"
              {...form.register("motivoRetificacao")}
            />
            {form.formState.errors.motivoRetificacao ? (
              <p className="text-[13px] text-destructive" role="alert">
                {form.formState.errors.motivoRetificacao.message}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={salvando}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="min-h-11" disabled={salvando}>
              {salvando ? "Salvando…" : "Salvar retificação"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
