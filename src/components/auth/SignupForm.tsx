"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
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
import {
  PLANOS_MARKETING,
  isPlanoCadastroId,
  type PlanoCadastroId,
} from "@/lib/cadastro/planos";
import {
  salvarRascunhoCadastro,
  salvarSenhaCadastroEmMemoria,
} from "@/lib/cadastro/rascunho";

const schema = z
  .object({
    adminNome: z.string().min(1, "Informe seu nome."),
    email: z.string().email("Informe um e-mail válido."),
    senha: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
    confirmarSenha: z.string().min(1, "Confirme a senha."),
    planoId: z.string().refine(isPlanoCadastroId, "Selecione um plano."),
  })
  .refine((data) => data.senha === data.confirmarSenha, {
    message: "As senhas não coincidem.",
    path: ["confirmarSenha"],
  });

type FormValues = z.infer<typeof schema>;

type SignupFormProps = {
  /** Plano pré-selecionado via `?plano=` da landing. */
  planoInicial?: PlanoCadastroId | null;
};

/**
 * Etapa 1 do cadastro: dados pessoais + plano.
 * Não cria usuário/clínica — só grava rascunho e avança para `/cadastro/clinica`.
 */
export function SignupForm({ planoInicial = null }: SignupFormProps) {
  const router = useRouter();
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      adminNome: "",
      email: "",
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

    // Senha só em memória de módulo — nunca sessionStorage/localStorage.
    salvarSenhaCadastroEmMemoria(values.senha);
    salvarRascunhoCadastro({
      adminNome: values.adminNome.trim(),
      email: values.email.trim().toLowerCase(),
      planoId: values.planoId,
    });

    router.push("/cadastro/clinica");
  }

  return (
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
                <Input autoComplete="name" {...field} />
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
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
  );
}
