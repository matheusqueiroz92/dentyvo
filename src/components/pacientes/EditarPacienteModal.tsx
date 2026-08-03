"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { atualizarPacienteAction } from "@/actions/paciente";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatarCpfCompleto } from "@/lib/pacientes/cpf";
import { formatarTelefoneBr } from "@/lib/pacientes/formatacao";
import type { PacienteDTO } from "@/lib/pacientes/types";
import {
  pacienteFormSchema,
  type PacienteFormValues,
} from "@/lib/pacientes/schema";

import { PacienteFormFields } from "./PacienteFormFields";

type EditarPacienteModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paciente: PacienteDTO | null;
  onAtualizado: (paciente: PacienteDTO) => void;
};

export function EditarPacienteModal({
  open,
  onOpenChange,
  paciente,
  onAtualizado,
}: EditarPacienteModalProps) {
  const form = useForm<PacienteFormValues>({
    resolver: zodResolver(pacienteFormSchema),
    defaultValues: {
      nome: "",
      cpf: "",
      telefone: "",
      dataNascimento: "",
      contatoEmergencia: "",
    },
  });

  useEffect(() => {
    if (open && paciente) {
      form.reset({
        nome: paciente.nome,
        cpf: formatarCpfCompleto(paciente.cpf),
        telefone: formatarTelefoneBr(paciente.telefone),
        dataNascimento: paciente.dataNascimentoIso,
        contatoEmergencia: paciente.contatoEmergencia ?? "",
      });
    }
  }, [open, paciente, form]);

  async function onSubmit(values: PacienteFormValues) {
    if (!paciente) return;

    const result = await atualizarPacienteAction({
      pacienteId: paciente.id,
      nome: values.nome,
      telefone: values.telefone,
      dataNascimento: values.dataNascimento,
      contatoEmergencia: values.contatoEmergencia?.trim() || undefined,
    });

    if (result.serverError || !result.data) {
      toast.error(
        result.serverError?.mensagem ??
          "Não foi possível atualizar o paciente.",
      );
      return;
    }

    toast.success("Paciente atualizado.");
    onAtualizado(result.data);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Editar paciente</DialogTitle>
          <DialogDescription>
            Atualize os dados cadastrais. O CPF não pode ser alterado.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
        >
          <PacienteFormFields
            form={form}
            cpfSomenteLeitura
            idPrefix="editar-paciente"
          />

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
              disabled={form.formState.isSubmitting || !paciente}
            >
              {form.formState.isSubmitting ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
