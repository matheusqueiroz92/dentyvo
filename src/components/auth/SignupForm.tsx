"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { criarClinicaComAdminAction } from "@/actions/criar-clinica-com-admin";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authClient } from "@/lib/auth-client";
import type { ServerActionError } from "@/lib/safe-action";

const schema = z.object({
  clinicaNome: z.string().min(1, "Informe o nome da clínica."),
  endereco: z.string().min(1, "Informe o endereço."),
  tipoDocumento: z.enum(["cpf", "cnpj"]),
  documento: z.string().min(1, "Informe o documento."),
  adminNome: z.string().min(1, "Informe seu nome."),
  email: z.string().email("Informe um e-mail válido."),
  senha: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
});

type FormValues = z.infer<typeof schema>;

export function SignupForm() {
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      clinicaNome: "",
      endereco: "",
      tipoDocumento: "cnpj",
      documento: "",
      adminNome: "",
      email: "",
      senha: "",
    },
  });

  const tipoDocumento = useWatch({
    control: form.control,
    name: "tipoDocumento",
  });

  async function onSubmit(values: FormValues) {
    setErroGeral(null);
    const result = await criarClinicaComAdminAction({
      clinica: {
        nome: values.clinicaNome,
        endereco: values.endereco,
        tipoDocumento: values.tipoDocumento,
        documento: values.documento,
      },
      admin: {
        nome: values.adminNome,
        email: values.email.trim().toLowerCase(),
        senha: values.senha,
      },
    });

    if (result.serverError) {
      const err = result.serverError as ServerActionError;
      setErroGeral(err.mensagem);
      return;
    }

    if (result.validationErrors) {
      setErroGeral("Revise os campos destacados e tente novamente.");
      return;
    }

    // signUpEmail (via CriarClinicaComAdmin) pode gravar cookie de sessão.
    // Encerramos a sessão e usamos navegação full-page para /login — soft
    // navigation com sessão ativa faz o PageAuthContainer redirecionar e
    // impede a mensagem de sucesso do cadastro.
    await authClient.signOut();
    window.location.assign("/login?cadastro=ok");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3" noValidate>
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Clínica
        </p>

        <FormField
          control={form.control}
          name="clinicaNome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da clínica</FormLabel>
              <FormControl>
                <Input autoComplete="organization" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="endereco"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço</FormLabel>
              <FormControl>
                <Input autoComplete="street-address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="tipoDocumento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Documento</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="cnpj">CNPJ</SelectItem>
                    <SelectItem value="cpf">CPF</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="documento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {tipoDocumento === "cpf" ? "CPF" : "CNPJ"}
                </FormLabel>
                <FormControl>
                  <Input inputMode="numeric" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <p className="pt-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Administrador
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

        <FormField
          control={form.control}
          name="senha"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
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
          idleLabel="Começar trial grátis"
          loadingLabel="Criando clínica…"
        />
      </form>
    </Form>
  );
}
