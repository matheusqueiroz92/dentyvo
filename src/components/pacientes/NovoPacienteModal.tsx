"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { criarPacienteAction } from "@/actions/paciente";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PacienteDTO } from "@/lib/pacientes/types";
import {
  pacienteFormSchema,
  type PacienteFormValues,
} from "@/lib/pacientes/schema";

import { PacienteFormFields } from "./PacienteFormFields";

const DEFAULTS: PacienteFormValues = {
  nome: "",
  cpf: "",
  telefone: "",
  dataNascimento: "",
  contatoEmergencia: "",
};

type NovoPacienteModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCriado: (paciente: PacienteDTO) => void;
};

export function NovoPacienteModal({
  open,
  onOpenChange,
  onCriado,
}: NovoPacienteModalProps) {
  const form = useForm<PacienteFormValues>({
    resolver: zodResolver(pacienteFormSchema),
    defaultValues: DEFAULTS,
  });

  useEffect(() => {
    if (open) {
      form.reset(DEFAULTS);
    }
  }, [open, form]);

  async function onSubmit(values: PacienteFormValues) {
    const result = await criarPacienteAction({
      nome: values.nome,
      cpf: values.cpf,
      telefone: values.telefone,
      dataNascimento: values.dataNascimento,
      contatoEmergencia: values.contatoEmergencia?.trim() || undefined,
    });

    if (result.serverError || !result.data) {
      toast.error(
        result.serverError?.mensagem ?? "Não foi possível cadastrar o paciente.",
      );
      return;
    }

    toast.success("Paciente cadastrado.");
    onCriado(result.data);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Novo paciente</DialogTitle>
          <DialogDescription>
            Cadastre os dados básicos do paciente na clínica.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
        >
          <PacienteFormFields form={form} idPrefix="novo-paciente" />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
