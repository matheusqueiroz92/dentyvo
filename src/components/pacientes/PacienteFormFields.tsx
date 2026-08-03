"use client";

import type { UseFormReturn } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mascararCpfInput } from "@/lib/pacientes/cpf";
import { mascararTelefoneInput } from "@/lib/pacientes/formatacao";
import type { PacienteFormValues } from "@/lib/pacientes/schema";

type PacienteFormFieldsProps = {
  form: UseFormReturn<PacienteFormValues>;
  disabled?: boolean;
  /** CPF imutável após cadastro — exibe o valor mas bloqueia edição. */
  cpfSomenteLeitura?: boolean;
  idPrefix?: string;
};

export function PacienteFormFields({
  form,
  disabled = false,
  cpfSomenteLeitura = false,
  idPrefix = "paciente",
}: PacienteFormFieldsProps) {
  const {
    register,
    setValue,
    formState: { errors },
  } = form;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-nome`}>Nome</Label>
        <Input
          id={`${idPrefix}-nome`}
          autoComplete="name"
          disabled={disabled}
          aria-invalid={!!errors.nome}
          {...register("nome")}
        />
        {errors.nome ? (
          <p className="text-xs text-destructive">{errors.nome.message}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-cpf`}>CPF</Label>
          <Input
            id={`${idPrefix}-cpf`}
            inputMode="numeric"
            autoComplete="off"
            disabled={disabled || cpfSomenteLeitura}
            readOnly={cpfSomenteLeitura}
            aria-invalid={!!errors.cpf}
            {...register("cpf", {
              onChange: (e) => {
                if (cpfSomenteLeitura) return;
                setValue("cpf", mascararCpfInput(e.target.value), {
                  shouldValidate: form.formState.isSubmitted,
                });
              },
            })}
          />
          {cpfSomenteLeitura ? (
            <p className="text-xs text-muted-foreground">
              O CPF não pode ser alterado após o cadastro.
            </p>
          ) : null}
          {errors.cpf ? (
            <p className="text-xs text-destructive">{errors.cpf.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-telefone`}>Telefone</Label>
          <Input
            id={`${idPrefix}-telefone`}
            inputMode="tel"
            autoComplete="tel"
            disabled={disabled}
            aria-invalid={!!errors.telefone}
            {...register("telefone", {
              onChange: (e) => {
                setValue("telefone", mascararTelefoneInput(e.target.value), {
                  shouldValidate: form.formState.isSubmitted,
                });
              },
            })}
          />
          {errors.telefone ? (
            <p className="text-xs text-destructive">
              {errors.telefone.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-nascimento`}>Data de nascimento</Label>
        <Input
          id={`${idPrefix}-nascimento`}
          type="date"
          disabled={disabled}
          aria-invalid={!!errors.dataNascimento}
          className="tabular-nums"
          {...register("dataNascimento")}
        />
        {errors.dataNascimento ? (
          <p className="text-xs text-destructive">
            {errors.dataNascimento.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-emergencia`}>
          Contato de emergência{" "}
          <span className="font-normal text-muted-foreground">(opcional)</span>
        </Label>
        <Input
          id={`${idPrefix}-emergencia`}
          disabled={disabled}
          aria-invalid={!!errors.contatoEmergencia}
          {...register("contatoEmergencia")}
        />
        {errors.contatoEmergencia ? (
          <p className="text-xs text-destructive">
            {errors.contatoEmergencia.message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
