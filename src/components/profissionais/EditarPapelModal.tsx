"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { alterarPapelMembroAction } from "@/actions/profissionais";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import {
  editarPapelFormSchema,
  type EditarPapelFormValues,
} from "@/lib/profissionais/schema";
import type { MembroEquipeDTO } from "@/lib/profissionais/types";

import { CamposPapelCro } from "./CamposPapelCro";

type EditarPapelModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  membro: MembroEquipeDTO | null;
  onAtualizado: (membro: MembroEquipeDTO) => void;
};

export function EditarPapelModal({
  open,
  onOpenChange,
  membro,
  onAtualizado,
}: EditarPapelModalProps) {
  const form = useForm<EditarPapelFormValues>({
    resolver: zodResolver(editarPapelFormSchema),
    defaultValues: { papel: "recepcao", cro: "" },
  });

  useEffect(() => {
    if (open && membro) {
      form.reset({
        papel: membro.papel,
        cro: membro.cro ?? "",
      });
    }
  }, [open, membro, form]);

  function focarPrimeiroErro(errors: { papel?: unknown; cro?: unknown }) {
    if (errors.papel) {
      form.setFocus("papel");
      return;
    }
    if (errors.cro) {
      form.setFocus("cro");
    }
  }

  async function onSubmit(values: EditarPapelFormValues) {
    if (!membro) return;
    const result = await alterarPapelMembroAction({
      profissionalId: membro.id,
      novoPapel: values.papel,
      ...(values.papel === "dentista" && values.cro.trim()
        ? { cro: values.cro.trim() }
        : {}),
    });

    if (result.validationErrors) {
      toast.error("Revise os campos destacados e tente novamente.");
      focarPrimeiroErro(result.validationErrors);
      return;
    }

    if (result.serverError || !result.data) {
      toast.error(
        result.serverError?.mensagem ??
          "Não foi possível alterar o papel.",
      );
      return;
    }

    toast.success("Papel atualizado.");
    onAtualizado(result.data);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Alterar papel</DialogTitle>
          <DialogDescription>
            {membro
              ? `Defina o papel de ${membro.nome} na clínica.`
              : "Defina o papel do membro na clínica."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(onSubmit, focarPrimeiroErro)}
            noValidate
          >
            <CamposPapelCro />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                disabled={form.formState.isSubmitting}
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="min-h-11"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Salvando…" : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
