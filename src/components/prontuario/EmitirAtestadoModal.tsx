"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, type ComponentProps } from "react";
import { useForm, useWatch } from "react-hook-form";

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
import { Textarea } from "@/components/ui/textarea";
import {
  calcularDataFimIso,
  dataCivilUtcDeIso,
  formatarPeriodoAfastamento,
  hojeIsoLocal,
} from "@/lib/atestado/periodo";
import {
  emitirAtestadoFormSchema,
  valoresIniciaisAtestado,
  type EmitirAtestadoFormValues,
} from "@/lib/atestado/schema";

type EmitirAtestadoModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salvando: boolean;
  onSalvar: (values: EmitirAtestadoFormValues) => Promise<void>;
};

export function EmitirAtestadoModal({
  open,
  onOpenChange,
  salvando,
  onSalvar,
}: EmitirAtestadoModalProps) {
  const form = useForm<EmitirAtestadoFormValues>({
    resolver: zodResolver(emitirAtestadoFormSchema),
    defaultValues: valoresIniciaisAtestado(hojeIsoLocal()),
  });

  const dataInicio = useWatch({ control: form.control, name: "dataInicio" });
  const quantidadeDias = useWatch({
    control: form.control,
    name: "quantidadeDias",
  });

  const dataFimIso = calcularDataFimIso(
    dataInicio ?? "",
    Number(quantidadeDias),
  );
  const periodoPrevisto = dataFimIso
    ? formatarPeriodoAfastamento(
        dataCivilUtcDeIso(dataInicio),
        dataCivilUtcDeIso(dataFimIso),
        Number(quantidadeDias),
      )
    : null;

  useEffect(() => {
    if (open) {
      form.reset(valoresIniciaisAtestado(hojeIsoLocal()));
    }
  }, [open, form]);

  async function handleSubmit(values: EmitirAtestadoFormValues) {
    await onSalvar(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Novo atestado</DialogTitle>
          <DialogDescription>
            Após emitir, o documento não poderá ser editado — correção exige
            nova emissão.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5"
          onSubmit={form.handleSubmit(handleSubmit, (errors) => {
            const ordem = [
              "motivo",
              "cid",
              "dataInicio",
              "quantidadeDias",
            ] as const;
            const campo = ordem.find((nome) => errors[nome]);
            if (campo) form.setFocus(campo);
          })}
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="atestado-motivo">Motivo / finalidade</Label>
            <Textarea
              id="atestado-motivo"
              disabled={salvando}
              placeholder="Ex.: acompanhamento odontológico, repouso pós-procedimento"
              aria-invalid={Boolean(form.formState.errors.motivo)}
              {...form.register("motivo")}
            />
            {form.formState.errors.motivo ? (
              <p className="text-[13px] text-destructive" role="alert">
                {form.formState.errors.motivo.message}
              </p>
            ) : null}
          </div>

          <CampoTexto
            id="atestado-cid"
            label="CID (opcional)"
            disabled={salvando}
            erro={form.formState.errors.cid?.message}
            placeholder="ex: K08.1"
            autoCapitalize="characters"
            {...form.register("cid")}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <CampoTexto
              id="atestado-inicio"
              label="Data de início"
              type="date"
              disabled={salvando}
              erro={form.formState.errors.dataInicio?.message}
              className="tabular-nums"
              {...form.register("dataInicio")}
            />
            <CampoTexto
              id="atestado-dias"
              label="Quantidade de dias"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              disabled={salvando}
              erro={form.formState.errors.quantidadeDias?.message}
              className="tabular-nums"
              {...form.register("quantidadeDias", { valueAsNumber: true })}
            />
          </div>

          <p
            className="rounded-md border border-border bg-muted/40 px-3 py-2 text-[13px] text-muted-foreground"
            aria-live="polite"
          >
            {periodoPrevisto ? (
              <>
                Término previsto:{" "}
                <span className="font-medium tabular-nums text-foreground">
                  {periodoPrevisto}
                </span>
              </>
            ) : (
              "Preencha a data de início e a quantidade de dias para ver o término."
            )}
          </p>

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
              {salvando ? "Emitindo…" : "Emitir atestado"}
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
