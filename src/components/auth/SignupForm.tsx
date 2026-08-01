"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { ContinuarComGoogleButton } from "@/components/auth/ContinuarComGoogleButton";
import { PromoLancamentoCallout } from "@/components/marketing/PromoLancamentoCallout";
import { Checkbox } from "@/components/ui/checkbox";
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

export const MENSAGEM_ACEITE_OBRIGATORIO =
  "Aceite os Termos de uso e a Política de Privacidade para continuar.";

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
    aceiteTermos: z.literal(true, {
      error: MENSAGEM_ACEITE_OBRIGATORIO,
    }),
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
  aceiteTermos: boolean;
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
      aceiteTermos: false,
    },
  });

  const planoSelecionado = useWatch({
    control: form.control,
    name: "planoId",
  });

  const aceiteTermos = useWatch({
    control: form.control,
    name: "aceiteTermos",
  });

  function garantirAceiteLegal(): boolean {
    if (aceiteTermos === true) return true;
    form.setError("aceiteTermos", { message: MENSAGEM_ACEITE_OBRIGATORIO });
    setErroGeral(MENSAGEM_ACEITE_OBRIGATORIO);
    return false;
  }

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
          <ContinuarComGoogleButton
            onError={setErroGeral}
            onBeforeStart={garantirAceiteLegal}
          />
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

          <FormField
            control={form.control}
            name="aceiteTermos"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start gap-3 rounded-md border border-border bg-muted/30 px-3 py-3">
                <FormControl>
                  <Checkbox
                    checked={field.value === true}
                    onCheckedChange={(checked) => {
                      field.onChange(checked === true);
                      if (checked === true) setErroGeral(null);
                    }}
                    className="mt-0.5 size-5"
                    aria-required
                  />
                </FormControl>
                <div className="space-y-1 leading-[22px]">
                  <FormLabel className="text-sm font-normal text-foreground">
                    Li e aceito os{" "}
                    <Link
                      href="/termos"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Termos de uso
                    </Link>{" "}
                    e a{" "}
                    <Link
                      href="/privacidade"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Política de Privacidade
                    </Link>
                    .
                  </FormLabel>
                  <FormMessage />
                </div>
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
            idleLabel="Continuar"
            loadingLabel="Avançando…"
          />
        </form>
      </Form>
    </div>
  );
}

/**
 * Etapa 1 do cadastro: dados pessoais + plano + aceite legal.
 * Com sessão Google: nome/e-mail pré-preenchidos, sem senha.
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
