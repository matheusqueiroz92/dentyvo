"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";

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
import {
  emitirOrcamentoFormSchema,
  itemOrcamentoVazio,
  type EmitirOrcamentoFormValues,
  valoresIniciaisOrcamento,
} from "@/lib/orcamento/schema";
import type { ProcedimentoOrcamentoOpcao } from "@/lib/orcamento/types";

const formatadorMoeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

type EmitirOrcamentoModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salvando: boolean;
  procedimentos: ProcedimentoOrcamentoOpcao[];
  onSalvar: (values: EmitirOrcamentoFormValues) => Promise<void>;
};

export function EmitirOrcamentoModal({
  open,
  onOpenChange,
  salvando,
  procedimentos,
  onSalvar,
}: EmitirOrcamentoModalProps) {
  const form = useForm<EmitirOrcamentoFormValues>({
    resolver: zodResolver(emitirOrcamentoFormSchema),
    defaultValues: valoresIniciaisOrcamento(),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "itens",
  });

  const itensWatch = useWatch({ control: form.control, name: "itens" });

  const total = useMemo(() => {
    if (!itensWatch) return 0;
    return itensWatch.reduce((acc, item) => {
      const valor = Number(item.valor) || 0;
      const qtd = Number(item.quantidade) || 0;
      return acc + valor * qtd;
    }, 0);
  }, [itensWatch]);

  useEffect(() => {
    if (open) {
      form.reset(valoresIniciaisOrcamento());
    }
  }, [open, form]);

  function aoEscolherProcedimento(index: number, procedimentoId: string) {
    form.setValue(`itens.${index}.procedimentoId`, procedimentoId, {
      shouldValidate: true,
    });
    const proc = procedimentos.find((p) => p.id === procedimentoId);
    if (proc) {
      form.setValue(`itens.${index}.valor`, proc.valor, {
        shouldValidate: true,
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Novo orçamento</DialogTitle>
          <DialogDescription>
            Monte a proposta com procedimentos da clínica. O valor de cada item
            pode ser ajustado nesta emissão (snapshot). Após emitir, o
            conteúdo não poderá ser editado.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5"
          onSubmit={form.handleSubmit(async (values) => {
            await onSalvar(values);
          })}
          noValidate
        >
          <div className="space-y-4">
            {fields.map((field, index) => {
              const errosItem = form.formState.errors.itens?.[index];
              return (
                <fieldset
                  key={field.id}
                  className="space-y-3 rounded-lg border border-border p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <legend className="text-sm font-medium text-foreground">
                      Item {index + 1}
                    </legend>
                    {fields.length > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="min-h-11 shrink-0 text-destructive hover:text-destructive"
                        disabled={salvando}
                        onClick={() => remove(index)}
                        aria-label={`Remover item ${index + 1}`}
                      >
                        <Trash2 className="size-4" aria-hidden />
                        Remover
                      </Button>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`item-${index}-procedimento`}>
                      Procedimento
                    </Label>
                    <select
                      id={`item-${index}-procedimento`}
                      className="flex min-h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
                      disabled={salvando || procedimentos.length === 0}
                      value={itensWatch?.[index]?.procedimentoId ?? ""}
                      onChange={(e) =>
                        aoEscolherProcedimento(index, e.target.value)
                      }
                    >
                      <option value="">Selecione…</option>
                      {procedimentos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nome} ({formatadorMoeda.format(p.valor)})
                        </option>
                      ))}
                    </select>
                    {errosItem?.procedimentoId ? (
                      <p className="text-xs text-destructive">
                        {errosItem.procedimentoId.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`item-${index}-valor`}>
                        Valor unitário (R$)
                      </Label>
                      <Input
                        id={`item-${index}-valor`}
                        type="number"
                        min={0}
                        step="0.01"
                        className="min-h-11 tabular-nums"
                        disabled={salvando}
                        {...form.register(`itens.${index}.valor`, {
                          valueAsNumber: true,
                        })}
                      />
                      {errosItem?.valor ? (
                        <p className="text-xs text-destructive">
                          {errosItem.valor.message}
                        </p>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`item-${index}-quantidade`}>
                        Quantidade
                      </Label>
                      <Input
                        id={`item-${index}-quantidade`}
                        type="number"
                        min={1}
                        step={1}
                        className="min-h-11 tabular-nums"
                        disabled={salvando}
                        {...form.register(`itens.${index}.quantidade`, {
                          valueAsNumber: true,
                        })}
                      />
                      {errosItem?.quantidade ? (
                        <p className="text-xs text-destructive">
                          {errosItem.quantidade.message}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </fieldset>
              );
            })}
          </div>

          {form.formState.errors.itens?.root ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.itens.root.message}
            </p>
          ) : null}
          {typeof form.formState.errors.itens?.message === "string" ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.itens.message}
            </p>
          ) : null}

          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            disabled={salvando || procedimentos.length === 0}
            onClick={() => append(itemOrcamentoVazio())}
          >
            <Plus className="size-4" aria-hidden />
            Adicionar item
          </Button>

          <div className="space-y-2">
            <Label htmlFor="validoAte">Válido até (opcional)</Label>
            <Input
              id="validoAte"
              type="date"
              className="min-h-11 tabular-nums"
              disabled={salvando}
              {...form.register("validoAte")}
            />
            <p className="text-[13px] text-muted-foreground">
              Informativo para o paciente — não altera o status automaticamente.
            </p>
            {form.formState.errors.validoAte ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.validoAte.message}
              </p>
            ) : null}
          </div>

          <div className="rounded-lg border border-border bg-muted/40 px-4 py-3">
            <p className="text-xs text-muted-foreground">Total do orçamento</p>
            <p className="text-lg font-semibold tabular-nums text-foreground">
              {formatadorMoeda.format(total)}
            </p>
          </div>

          {procedimentos.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">
              Cadastre procedimentos na clínica antes de emitir um orçamento.
            </p>
          ) : null}

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
            <Button
              type="submit"
              className="min-h-11"
              disabled={salvando || procedimentos.length === 0}
            >
              {salvando ? "Emitindo…" : "Emitir orçamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
