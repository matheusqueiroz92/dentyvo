"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  anamneseFormSchema,
  respostasParaForm,
  SECAO_ANAMNESE_LABELS,
  SECOES_ANAMNESE_FORM,
  type AnamneseFormValues,
} from "@/lib/prontuario/schema";
import type { RespostasAnamneseDTO } from "@/lib/prontuario/types";
import { cn } from "@/lib/utils";

type AnamneseFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modo: "preencher" | "atualizar";
  valoresIniciais?: RespostasAnamneseDTO | null;
  salvando: boolean;
  onSalvar: (values: AnamneseFormValues) => Promise<void>;
};

export function AnamneseForm({
  open,
  onOpenChange,
  modo,
  valoresIniciais,
  salvando,
  onSalvar,
}: AnamneseFormProps) {
  const form = useForm<AnamneseFormValues>({
    resolver: zodResolver(anamneseFormSchema),
    defaultValues: respostasParaForm(null),
  });

  useEffect(() => {
    if (open) {
      form.reset(
        respostasParaForm(
          valoresIniciais
            ? {
                historicoMedico: {
                  texto: valoresIniciais.historicoMedico.texto ?? "",
                  negado: valoresIniciais.historicoMedico.negado,
                },
                alergias: {
                  texto: valoresIniciais.alergias.texto ?? "",
                  negado: valoresIniciais.alergias.negado,
                },
                medicacoesEmUso: {
                  texto: valoresIniciais.medicacoesEmUso.texto ?? "",
                  negado: valoresIniciais.medicacoesEmUso.negado,
                },
                condicoesPreexistentes: {
                  texto: valoresIniciais.condicoesPreexistentes.texto ?? "",
                  negado: valoresIniciais.condicoesPreexistentes.negado,
                },
              }
            : null,
        ),
      );
    }
  }, [open, valoresIniciais, form]);

  async function handleSubmit(values: AnamneseFormValues) {
    await onSalvar(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px] md:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>
            {modo === "preencher" ? "Preencher anamnese" : "Atualizar anamnese"}
          </DialogTitle>
          <DialogDescription>
            {modo === "preencher"
              ? "Preencha as quatro seções obrigatórias. Em cada uma, informe o texto ou marque “nada a declarar / nega”."
              : "Isso criará uma nova versão; o histórico anterior é preservado."}
          </DialogDescription>
        </DialogHeader>

        {modo === "atualizar" ? (
          <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-[13px] text-muted-foreground">
            Ao salvar, uma nova versão completa é registrada. Versões anteriores
            continuam consultáveis no histórico.
          </p>
        ) : null}

        <form
          className="space-y-5"
          onSubmit={form.handleSubmit(handleSubmit)}
          noValidate
        >
          {SECOES_ANAMNESE_FORM.map((chave) => {
            const erroSecao = form.formState.errors[chave];
            const mensagem =
              erroSecao?.texto?.message ??
              erroSecao?.message ??
              erroSecao?.negado?.message;

            return (
              <fieldset key={chave} className="space-y-2">
                <legend className="text-sm font-medium text-foreground">
                  {SECAO_ANAMNESE_LABELS[chave]}
                </legend>

                <Controller
                  control={form.control}
                  name={`${chave}.texto`}
                  render={({ field }) => (
                    <div className="space-y-1.5">
                      <Label htmlFor={`anamnese-${chave}-texto`}>Texto</Label>
                      <textarea
                        id={`anamnese-${chave}-texto`}
                        rows={3}
                        disabled={salvando}
                        value={field.value}
                        onChange={(e) => {
                          const valor = e.target.value;
                          field.onChange(valor);
                          if (valor.trim()) {
                            form.setValue(`${chave}.negado`, false, {
                              shouldValidate: true,
                              shouldDirty: true,
                            });
                          }
                        }}
                        onBlur={field.onBlur}
                        aria-invalid={Boolean(mensagem)}
                        className={cn(
                          "w-full min-w-0 rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
                        )}
                        placeholder="Descreva ou deixe em branco se negar"
                      />
                    </div>
                  )}
                />

                <Controller
                  control={form.control}
                  name={`${chave}.negado`}
                  render={({ field }) => (
                    <label className="flex min-h-11 cursor-pointer items-center gap-2">
                      <Checkbox
                        checked={field.value}
                        disabled={salvando}
                        onCheckedChange={(checked) => {
                          const negado = checked === true;
                          field.onChange(negado);
                          if (negado) {
                            form.setValue(`${chave}.texto`, "", {
                              shouldValidate: true,
                              shouldDirty: true,
                            });
                          }
                        }}
                      />
                      <span className="text-[13px] text-foreground">
                        Nada a declarar / nega
                      </span>
                    </label>
                  )}
                />

                {mensagem ? (
                  <p className="text-[13px] text-destructive" role="alert">
                    {mensagem}
                  </p>
                ) : null}
              </fieldset>
            );
          })}

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
              {salvando ? "Salvando…" : "Salvar anamnese"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
