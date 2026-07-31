"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { ContinuarComGoogleButton } from "@/components/auth/ContinuarComGoogleButton";
import { PromoLancamentoCallout } from "@/components/marketing/PromoLancamentoCallout";
import { PricingCard } from "@/components/ui/PricingCard";
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
import {
  PLANOS_MARKETING,
  isPlanoCadastroId,
  type PlanoCadastroId,
} from "@/lib/cadastro/planos";
import {
  salvarRascunhoCadastro,
  salvarSenhaCadastroEmMemoria,
} from "@/lib/cadastro/rascunho";

function criarSchema(viaSocial: boolean) {
  const base = z.object({
    adminNome: z.string().min(1, "Informe seu nome."),
    email: z.string().email("Informe um e-mail válido."),
    senha: viaSocial
      ? z.string().optional()
      : z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
    confirmarSenha: viaSocial
      ? z.string().optional()
      : z.string().min(1, "Confirme a senha."),
    planoId: z.string().refine(isPlanoCadastroId, "Selecione um plano."),
  });

  if (viaSocial) return base;

  return base.refine((data) => data.senha === data.confirmarSenha, {
    message: "As senhas não coincidem.",
    path: ["confirmarSenha"],
  });
}

type FormValues = {
  adminNome: string;
  email: string;
  senha?: string;
  confirmarSenha?: string;
  planoId: string;
};

type SignupFormProps = {
  /** Plano pré-selecionado via `?plano=` da landing. */
  planoInicial?: PlanoCadastroId | null;
};

type SignupFormFieldsProps = SignupFormProps & {
  viaSocial: boolean;
  nomeInicial: string;
  emailInicial: string;
};

function SignupFormFields({
  planoInicial = null,
  viaSocial,
  nomeInicial,
  emailInicial,
}: SignupFormFieldsProps) {
  const router = useRouter();
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const schema = useMemo(() => criarSchema(viaSocial), [viaSocial]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      adminNome: nomeInicial,
      email: emailInicial,
      senha: "",
      confirmarSenha: "",
      planoId: planoInicial ?? "",
    },
  });

  const planoSelecionado = useWatch({
    control: form.control,
    name: "planoId",
  });

  function onSubmit(values: FormValues) {
    setErroGeral(null);
    if (!isPlanoCadastroId(values.planoId)) {
      setErroGeral("Selecione um plano para continuar.");
      return;
    }

    if (!viaSocial && values.senha) {
      salvarSenhaCadastroEmMemoria(values.senha);
    }

    salvarRascunhoCadastro({
      adminNome: values.adminNome.trim(),
      email: values.email.trim().toLowerCase(),
      planoId: values.planoId,
    });

    router.push("/cadastro/clinica");
  }

  return (
    <div className="space-y-6">
      {!viaSocial ? (
        <>
          <ContinuarComGoogleButton onError={setErroGeral} />
          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden>
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">ou</span>
            </div>
          </div>
        </>
      ) : (
        <p role="status" className="text-sm text-muted-foreground">
          Conta Google conectada. Escolha seu plano para continuar.
        </p>
      )}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-5"
          noValidate
        >
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Seus dados
          </p>

          <FormField
            control={form.control}
            name="adminNome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Seu nome</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="name"
                    readOnly={viaSocial}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                    readOnly={viaSocial}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {!viaSocial ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="senha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmarSenha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar senha</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ) : null}

          <div className="space-y-3 pt-2">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Escolha seu plano
            </p>
            <PromoLancamentoCallout />
            <FormField
              control={form.control}
              name="planoId"
              render={() => (
                <FormItem>
                  <div className="grid gap-6 pt-2 lg:grid-cols-3 lg:items-stretch">
                    {PLANOS_MARKETING.map((plano) => (
                      <PricingCard
                        key={plano.id}
                        nome={plano.nome}
                        descricao={plano.descricao}
                        precoMinMensal={plano.precoMinMensal}
                        precoMaxMensal={plano.precoMaxMensal}
                        precoPromocionalMensal={plano.precoPromocionalMensal}
                        recursos={[...plano.recursos]}
                        ctaLabel="Selecionar"
                        onSelect={() =>
                          form.setValue("planoId", plano.id, {
                            shouldValidate: true,
                            shouldDirty: true,
                          })
                        }
                        selected={planoSelecionado === plano.id}
                        destaque={plano.destaque}
                        badge={plano.badge}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {erroGeral ? (
            <p role="alert" className="text-sm text-destructive">
              {erroGeral}
            </p>
          ) : null}

          <AuthSubmitButton
            isLoading={form.formState.isSubmitting}
            idleLabel="Continuar"
            loadingLabel="Avançando…"
          />
        </form>
      </Form>
    </div>
  );
}

/**
 * Etapa 1 do cadastro: dados pessoais + plano.
 * Com sessão Google: nome/e-mail pré-preenchidos, sem senha.
 * Não bloqueia em `isPending` — evita flash de "Carregando…" no cadastro.
 */
export function SignupForm({ planoInicial = null }: SignupFormProps) {
  const { data: sessao } = authClient.useSession();
  const viaSocial = Boolean(sessao?.user);

  return (
    <SignupFormFields
      key={viaSocial ? `social-${sessao!.user.id}` : "email"}
      planoInicial={planoInicial}
      viaSocial={viaSocial}
      nomeInicial={viaSocial ? (sessao!.user.name?.trim() ?? "") : ""}
      emailInicial={
        viaSocial ? sessao!.user.email.trim().toLowerCase() : ""
      }
    />
  );
}
