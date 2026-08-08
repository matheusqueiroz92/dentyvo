"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, type ComponentProps } from "react";
import { useFieldArray, useForm } from "react-hook-form";

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
  emitirReceitaFormSchema,
  itemReceitaVazio,
  type EmitirReceitaFormValues,
} from "@/lib/receituario/schema";

type EmitirReceitaModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salvando: boolean;
  onSalvar: (values: EmitirReceitaFormValues) => Promise<void>;
};

export function EmitirReceitaModal({
  open,
  onOpenChange,
  salvando,
  onSalvar,
}: EmitirReceitaModalProps) {
  const form = useForm<EmitirReceitaFormValues>({
    resolver: zodResolver(emitirReceitaFormSchema),
    defaultValues: { itens: [itemReceitaVazio()] },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "itens",
  });

  useEffect(() => {
    if (open) {
      form.reset({ itens: [itemReceitaVazio()] });
    }
  }, [open, form]);

  async function handleSubmit(values: EmitirReceitaFormValues) {
    await onSalvar(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Nova receita</DialogTitle>
          <DialogDescription>
            Preencha os itens da receita. Após emitir, o documento não poderá
            ser editado — correção exige nova emissão.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5"
          onSubmit={form.handleSubmit(handleSubmit, (errors) => {
            const primeiro = errors.itens
              ? Object.keys(errors.itens).find((k) => k !== "root" && k !== "message")
              : null;
            if (primeiro != null) {
              const campos = ["medicamento", "dosagem", "posologia", "duracao"] as const;
              const itemErr = errors.itens?.[Number(primeiro)];
              const campo = campos.find((c) => itemErr?.[c]);
              if (campo) {
                form.setFocus(`itens.${Number(primeiro)}.${campo}`);
              }
            }
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

                  <CampoTexto
                    id={`item-${index}-medicamento`}
                    label="Medicamento"
                    disabled={salvando}
                    erro={errosItem?.medicamento?.message}
                    placeholder="Ex.: Amoxicilina"
                    {...form.register(`itens.${index}.medicamento`)}
                  />
                  <CampoTexto
                    id={`item-${index}-dosagem`}
                    label="Dosagem"
                    disabled={salvando}
                    erro={errosItem?.dosagem?.message}
                    placeholder="Ex.: 500 mg"
                    {...form.register(`itens.${index}.dosagem`)}
                  />
                  <CampoTexto
                    id={`item-${index}-posologia`}
                    label="Posologia"
                    disabled={salvando}
                    erro={errosItem?.posologia?.message}
                    placeholder="Ex.: 1 comprimido de 8/8h"
                    {...form.register(`itens.${index}.posologia`)}
                  />
                  <CampoTexto
                    id={`item-${index}-duracao`}
                    label="Duração"
                    disabled={salvando}
                    erro={errosItem?.duracao?.message}
                    placeholder="Ex.: 7 dias"
                    {...form.register(`itens.${index}.duracao`)}
                  />
                </fieldset>
              );
            })}
          </div>

          {form.formState.errors.itens?.root?.message ||
          form.formState.errors.itens?.message ? (
            <p className="text-[13px] text-destructive" role="alert">
              {form.formState.errors.itens.root?.message ??
                form.formState.errors.itens.message}
            </p>
          ) : null}

          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full sm:w-auto"
            disabled={salvando}
            onClick={() => append(itemReceitaVazio())}
          >
            <Plus className="size-4" aria-hidden />
            Adicionar item
          </Button>

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
              {salvando ? "Emitindo…" : "Emitir receita"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CampoTexto({
  id,
  label,
  erro,
  disabled,
  placeholder,
  ...rest
}: {
  id: string;
  label: string;
  erro?: string;
  disabled?: boolean;
  placeholder?: string;
} & ComponentProps<typeof Input>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        disabled={disabled}
        placeholder={placeholder}
        aria-invalid={Boolean(erro)}
        {...rest}
      />
      {erro ? (
        <p className="text-[13px] text-destructive" role="alert">
          {erro}
        </p>
      ) : null}
    </div>
  );
}
