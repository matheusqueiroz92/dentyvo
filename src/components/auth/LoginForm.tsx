"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { obterDestinoPosLogin } from "@/actions/obter-destino-pos-login";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { ContinuarComGoogleButton } from "@/components/auth/ContinuarComGoogleButton";
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

export const MENSAGEM_CADASTRO_OK =
  "Clínica cadastrada com sucesso. Faça login para continuar.";

const schema = z.object({
  email: z.string().email("Informe um e-mail válido."),
  senha: z.string().min(1, "Informe a senha."),
});

type FormValues = z.infer<typeof schema>;

function mensagemErroOAuth(searchParams: URLSearchParams): string | null {
  if (searchParams.get("erro") === "oauth") {
    return "Não foi possível continuar com Google. Tente novamente.";
  }
  return null;
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const [erroGeral, setErroGeral] = useState<string | null>(() =>
    mensagemErroOAuth(searchParams),
  );
  const [sucessoCadastro] = useState(
    () => searchParams.get("cadastro") === "ok",
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", senha: "" },
  });

  async function onSubmit(values: FormValues) {
    setErroGeral(null);
    const { error } = await authClient.signIn.email({
      email: values.email.trim().toLowerCase(),
      password: values.senha,
    });

    if (error) {
      setErroGeral(
        error.message === "Invalid email or password"
          ? "E-mail ou senha inválidos."
          : (error.message ?? "Não foi possível entrar. Tente novamente."),
      );
      return;
    }

    const destino = await obterDestinoPosLogin();
    if (!destino.ok) {
      setErroGeral(destino.mensagem);
      return;
    }

    // Navegação full-page: soft push após set de cookie de sessão pode
    // deixar a URL em /login (mesmo padrão observado no cadastro).
    window.location.assign(destino.destino);
  }

  return (
    <div className="space-y-6">
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

          <FormField
            control={form.control}
            name="senha"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between gap-2">
                  <FormLabel>Senha</FormLabel>
                  <Link
                    href="/esqueceu-senha"
                    className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Esqueci a senha
                  </Link>
                </div>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {sucessoCadastro && !erroGeral ? (
            <p role="status" className="text-sm text-success">
              {MENSAGEM_CADASTRO_OK}
            </p>
          ) : null}

          {erroGeral ? (
            <p role="alert" className="text-sm text-destructive">
              {erroGeral}
            </p>
          ) : null}

          <AuthSubmitButton
            isLoading={form.formState.isSubmitting}
            idleLabel="Entrar"
            loadingLabel="Entrando…"
          />
        </form>
      </Form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">ou</span>
        </div>
      </div>

      <ContinuarComGoogleButton onError={setErroGeral} />
    </div>
  );
}
