"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { Button } from "@/components/ui/button";
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

const schema = z
  .object({
    senha: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
    confirmar: z.string().min(1, "Confirme a senha."),
  })
  .refine((v) => v.senha === v.confirmar, {
    message: "As senhas não coincidem.",
    path: ["confirmar"],
  });

type FormValues = z.infer<typeof schema>;

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const tokenInvalido = searchParams.get("error") === "INVALID_TOKEN";
  const [erroGeral, setErroGeral] = useState<string | null>(
    tokenInvalido ? "Link inválido ou expirado. Solicite um novo." : null,
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { senha: "", confirmar: "" },
  });

  if (!token && !tokenInvalido) {
    return (
      <div className="space-y-4 text-sm text-muted-foreground">
        <p role="alert">
          Link de redefinição incompleto. Solicite um novo e-mail.
        </p>
        <ButtonLinkFallback />
      </div>
    );
  }

  if (tokenInvalido || !token) {
    return (
      <div className="space-y-4">
        <p role="alert" className="text-sm text-destructive">
          {erroGeral}
        </p>
        <ButtonLinkFallback />
      </div>
    );
  }

  async function onSubmit(values: FormValues) {
    setErroGeral(null);
    const { error } = await authClient.resetPassword({
      newPassword: values.senha,
      token: token as string,
    });

    if (error) {
      setErroGeral(
        error.message ?? "Não foi possível redefinir a senha. Tente novamente.",
      );
      return;
    }

    window.location.assign("/login");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          control={form.control}
          name="senha"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nova senha</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmar"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar senha</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
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
          idleLabel="Redefinir senha"
          loadingLabel="Salvando…"
        />
      </form>
    </Form>
  );
}

function ButtonLinkFallback() {
  return (
    <Button asChild variant="outline" size="lg" className="w-full">
      <Link href="/esqueceu-senha">Solicitar novo link</Link>
    </Button>
  );
}
