"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { atualizarClinicaAction } from "@/actions/configuracoes-clinica";
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
import { montarPatchAtualizacaoClinica } from "@/lib/configuracoes/montar-patch";
import {
  editarDadosClinicaFormSchema,
  MENSAGEM_PELO_MENOS_UM_CAMPO,
  type EditarDadosClinicaFormValues,
} from "@/lib/configuracoes/schema";
import type { ClinicaGeralDTO } from "@/lib/configuracoes/types";

type EditarDadosClinicaModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinica: ClinicaGeralDTO;
  onAtualizada: (clinica: ClinicaGeralDTO) => void;
};

export function EditarDadosClinicaModal({
  open,
  onOpenChange,
  clinica,
  onAtualizada,
}: EditarDadosClinicaModalProps) {
  const form = useForm<EditarDadosClinicaFormValues>({
    resolver: zodResolver(editarDadosClinicaFormSchema),
    defaultValues: { nome: clinica.nome, endereco: clinica.endereco },
  });

  useEffect(() => {
    if (open) {
      form.reset({ nome: clinica.nome, endereco: clinica.endereco });
    }
  }, [open, clinica.nome, clinica.endereco, form]);

  function focarPrimeiroErro(errors: { nome?: unknown; endereco?: unknown }) {
    if (errors.nome) {
      form.setFocus("nome");
      return;
    }
    if (errors.endereco) {
      form.setFocus("endereco");
    }
  }

  async function onSubmit(values: EditarDadosClinicaFormValues) {
    const patch = montarPatchAtualizacaoClinica(values, {
      nome: clinica.nome,
      endereco: clinica.endereco,
    });
    if (!patch) {
      form.setError("root", { message: MENSAGEM_PELO_MENOS_UM_CAMPO });
      form.setFocus("nome");
      return;
    }

    const result = await atualizarClinicaAction(patch);

    if (result.validationErrors) {
      toast.error("Revise os campos destacados e tente novamente.");
      focarPrimeiroErro(result.validationErrors);
      return;
    }

    if (result.serverError || !result.data) {
      toast.error(
        result.serverError?.mensagem ??
          "Não foi possível atualizar a clínica.",
      );
      return;
    }

    toast.success("Dados da clínica atualizados.");
    onAtualizada(result.data);
    onOpenChange(false);
  }

  const erroRaiz = form.formState.errors.root?.message;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Editar dados da clínica</DialogTitle>
          <DialogDescription>
            Atualize nome e/ou endereço. O documento fiscal (CPF/CNPJ) é
            imutável e não entra neste formulário.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(onSubmit, focarPrimeiroErro)}
          noValidate
        >
          {erroRaiz ? (
            <p className="text-sm text-destructive" role="alert">
              {erroRaiz}
            </p>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="editar-clinica-nome">Nome</Label>
            <Input
              id="editar-clinica-nome"
              className="min-h-11"
              autoComplete="organization"
              disabled={form.formState.isSubmitting}
              aria-invalid={Boolean(form.formState.errors.nome)}
              {...form.register("nome")}
            />
            {form.formState.errors.nome ? (
              <p className="text-[13px] text-destructive" role="alert">
                {form.formState.errors.nome.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="editar-clinica-endereco">Endereço</Label>
            <Input
              id="editar-clinica-endereco"
              className="min-h-11"
              autoComplete="street-address"
              disabled={form.formState.isSubmitting}
              aria-invalid={Boolean(form.formState.errors.endereco)}
              {...form.register("endereco")}
            />
            {form.formState.errors.endereco ? (
              <p className="text-[13px] text-destructive" role="alert">
                {form.formState.errors.endereco.message}
              </p>
            ) : null}
          </div>

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
              className="min-h-11"
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
