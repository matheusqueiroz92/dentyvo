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
  registrarEvolucaoFormSchema,
  type RegistrarEvolucaoFormValues,
} from "@/lib/prontuario/schema";
import type { ProcedimentoOpcaoDTO } from "@/lib/prontuario/types";
import { cn } from "@/lib/utils";

type RegistrarEvolucaoModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  procedimentos: ProcedimentoOpcaoDTO[];
  salvando: boolean;
  onSalvar: (values: RegistrarEvolucaoFormValues) => Promise<void>;
};

export function RegistrarEvolucaoModal({
  open,
  onOpenChange,
  procedimentos,
  salvando,
  onSalvar,
}: RegistrarEvolucaoModalProps) {
  const form = useForm<RegistrarEvolucaoFormValues>({
    resolver: zodResolver(registrarEvolucaoFormSchema),
    defaultValues: { descricao: "", procedimentoId: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({ descricao: "", procedimentoId: "" });
    }
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Nova evolução</DialogTitle>
          <DialogDescription>
            Registre o atendimento clínico. O texto não poderá ser editado
            depois — use retificação se precisar corrigir.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(onSalvar)}
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="evolucao-descricao">Descrição</Label>
            <textarea
              id="evolucao-descricao"
              rows={5}
              disabled={salvando}
              aria-invalid={Boolean(form.formState.errors.descricao)}
              className={cn(
                "w-full min-w-0 rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
              )}
              placeholder="Descreva o atendimento, achados e conduta"
              {...form.register("descricao")}
            />
            {form.formState.errors.descricao ? (
              <p className="text-[13px] text-destructive" role="alert">
                {form.formState.errors.descricao.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="evolucao-procedimento">
              Procedimento{" "}
              <span className="font-normal text-muted-foreground">
                (opcional)
              </span>
            </Label>
            <select
              id="evolucao-procedimento"
              disabled={salvando}
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
              {...form.register("procedimentoId")}
            >
              <option value="">Nenhum</option>
              {procedimentos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
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
              {salvando ? "Salvando…" : "Registrar evolução"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
