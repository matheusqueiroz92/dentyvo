"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

const schema = z.object({
  email: z.string().email("Informe um e-mail válido."),
});

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const [enviado, setEnviado] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: FormValues) {
    setErroGeral(null);
    const { error } = await authClient.requestPasswordReset({
      email: values.email.trim().toLowerCase(),
      redirectTo: "/reset-senha",
    });

    if (error) {
      setErroGeral(
        error.message ?? "Não foi possível enviar o e-mail. Tente novamente.",
      );
      return;
    }

    setEnviado(true);
  }

  if (enviado) {
    return (
      <p role="status" className="text-sm leading-[22px] text-muted-foreground">
        Se existir uma conta com este e-mail, você receberá instruções para
        redefinir a senha. Verifique também a caixa de spam.
      </p>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="voce@clinica.com.br"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {erroGeral ? (
          <p role="alert" className="text-sm text-destructive">
            {erroGeral}
          </p>
        ) : null}

        <AuthSubmitButton
          isLoading={form.formState.isSubmitting}
          idleLabel="Enviar link"
          loadingLabel="Enviando…"
        />
      </form>
    </Form>
  );
}
