"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { obterDestinoPosLogin } from "@/actions/obter-destino-pos-login";
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
import { MENSAGEM_CONTA_SOCIAL_NAO_ENCONTRADA } from "@/lib/auth-destino";

const schema = z.object({
  email: z.string().email("Informe um e-mail válido."),
  senha: z.string().min(1, "Informe a senha."),
});

type FormValues = z.infer<typeof schema>;

function mensagemErroSocial(searchParams: URLSearchParams): string | null {
  const erro = searchParams.get("erro");
  if (erro === "conta-nao-encontrada") {
    return MENSAGEM_CONTA_SOCIAL_NAO_ENCONTRADA;
  }
  const error = searchParams.get("error");
  if (
    error === "signup_disabled" ||
    error === "SIGNUP_DISABLED" ||
    error?.toLowerCase().includes("signup")
  ) {
    return MENSAGEM_CONTA_SOCIAL_NAO_ENCONTRADA;
  }
  return null;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [erroGeral, setErroGeral] = useState<string | null>(() =>
    mensagemErroSocial(searchParams),
  );
  const [googleLoading, setGoogleLoading] = useState(false);

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

    router.push(destino.destino);
    router.refresh();
  }

  async function entrarComGoogle() {
    setErroGeral(null);
    setGoogleLoading(true);
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/auth/continuar",
      errorCallbackURL: "/login?erro=conta-nao-encontrada",
    });
    if (error) {
      setGoogleLoading(false);
      setErroGeral(
        error.message?.toLowerCase().includes("signup")
          ? MENSAGEM_CONTA_SOCIAL_NAO_ENCONTRADA
          : (error.message ?? MENSAGEM_CONTA_SOCIAL_NAO_ENCONTRADA),
      );
    }
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

          {erroGeral ? (
            <p role="alert" className="text-sm text-destructive">
              {erroGeral}
            </p>
          ) : null}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full cursor-pointer"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Entrando…" : "Entrar"}
          </Button>
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

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full cursor-pointer"
        disabled={googleLoading}
        onClick={entrarComGoogle}
      >
        {googleLoading ? "Redirecionando…" : "Continuar com Google"}
      </Button>
    </div>
  );
}
