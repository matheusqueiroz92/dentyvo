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
import { formatarCpfCompleto } from "@/lib/pacientes/cpf";
import { formatarTelefoneBr } from "@/lib/pacientes/formatacao";
import type { PacienteDTO } from "@/lib/pacientes/types";
import {
  pacienteFormSchema,
  type PacienteFormValues,
} from "@/lib/pacientes/schema";

import { PacienteFormFields } from "./PacienteFormFields";

/**
 * GAP: não existe `AtualizarPaciente` no backend ainda.
 * Este modal reutiliza o formulário, mas a persistência de edição fica
 * desabilitada até o caso de uso existir — não simula save local.
 */
type EditarPacienteModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paciente: PacienteDTO | null;
};

export function EditarPacienteModal({
  open,
  onOpenChange,
  paciente,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Editar paciente</DialogTitle>
          <DialogDescription>
            A edição ainda não está disponível: falta o caso de uso
            AtualizarPaciente no backend.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
          }}
          noValidate
        >
          <PacienteFormFields
            form={form}
            disabled
            idPrefix="editar-paciente"
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Fechar
            </Button>
            <Button type="submit" variant="primary" disabled>
              Salvar (indisponível)
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
