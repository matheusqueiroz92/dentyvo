"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { convidarUsuarioAction } from "@/actions/profissionais";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  convidarUsuarioFormSchema,
  type ConvidarUsuarioFormValues,
} from "@/lib/profissionais/schema";
import type { ConviteEquipeDTO } from "@/lib/profissionais/types";

import { CamposPapelCro } from "./CamposPapelCro";

const DEFAULTS: ConvidarUsuarioFormValues = {
  email: "",
  papel: "recepcao",
  cro: "",
};

type ConvidarUsuarioModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConvidado: (convite: ConviteEquipeDTO) => void;
};

export function ConvidarUsuarioModal({
  open,
  onOpenChange,
  onConvidado,
}: ConvidarUsuarioModalProps) {
  const form = useForm<ConvidarUsuarioFormValues>({
    resolver: zodResolver(convidarUsuarioFormSchema),
    defaultValues: DEFAULTS,
  });

  useEffect(() => {
    if (open) {
      form.reset(DEFAULTS);
    }
  }, [open, form]);

  function focarPrimeiroErro(errors: {
    email?: unknown;
    papel?: unknown;
    cro?: unknown;
  }) {
    if (errors.email) {
      form.setFocus("email");
      return;
    }
    if (errors.papel) {
      form.setFocus("papel");
      return;
    }
    if (errors.cro) {
      form.setFocus("cro");
    }
  }

  async function onSubmit(values: ConvidarUsuarioFormValues) {
    const result = await convidarUsuarioAction({
      email: values.email,
      papel: values.papel,
    });

    if (result.validationErrors) {
      toast.error("Revise os campos destacados e tente novamente.");
      focarPrimeiroErro(result.validationErrors);
      return;
    }

    if (result.serverError || !result.data) {
      toast.error(
        result.serverError?.mensagem ?? "Não foi possível enviar o convite.",
      );
      return;
    }

    toast.success("Convite enviado.");
    onConvidado(result.data);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Convidar usuário</DialogTitle>
          <DialogDescription>
            Envie um convite por e-mail. O convite expira em 72 horas.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(onSubmit, focarPrimeiroErro)}
            noValidate
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input
                      className="min-h-11"
                      type="email"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <CamposPapelCro mostrarCroHint />

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
                {form.formState.isSubmitting ? "Enviando…" : "Enviar convite"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
