"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { LogoUploadField } from "@/components/auth/LogoUploadField";
import { TemaClinicaPicker } from "@/components/auth/TemaClinicaPicker";
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
import type { TemaClinica } from "@/core/auth/domain/TemaClinica";
import { authClient } from "@/lib/auth-client";
import {
  limparRascunhoCadastro,
  lerRascunhoCadastro,
  type RascunhoCadastro,
} from "@/lib/cadastro/rascunho";
import type { ServerActionError } from "@/lib/safe-action";

const schema = z.object({
  clinicaNome: z.string().min(1, "Informe o nome da clínica."),
  endereco: z.string().min(1, "Informe o endereço."),
  tipoDocumento: z.enum(["cpf", "cnpj"]),
  documento: z.string().min(1, "Informe o documento."),
  tema: z.enum(["azul-padrao", "verde", "roxo", "grafite"]),
});

type FormValues = z.infer<typeof schema>;

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

type ConcluirCadastroFn = (input: {
  admin: { nome: string; email: string; senha: string };
  clinica: {
    nome: string;
    endereco: string;
    tipoDocumento: "cpf" | "cnpj";
    documento: string;
  };
  planoId: string;
  tema: TemaClinica;
  logoBase64?: string;
  logoContentType?: string;
  logoFileName?: string;
}) => Promise<{
  serverError?: unknown;
  validationErrors?: unknown;
  data?: { clinicaId: string; email: string };
}>;

type SignupClinicaFormProps = {
  /**
   * Server action injetada pela página (ou mock nos testes).
   * Evita import estático do composition root neste client component.
   */
  concluirCadastro: ConcluirCadastroFn;
};

/**
 * Etapa 2: detalhes da clínica + logo + tema.
 * Persiste Clinica/Admin via CriarClinicaComAdmin e redireciona ao dashboard.
 */
export function SignupClinicaForm({
  concluirCadastro,
}: SignupClinicaFormProps) {
  const router = useRouter();
  // null inicial em SSR e 1º paint do cliente — evita hydration mismatch
  // com sessionStorage.
  const [rascunho, setRascunho] = useState<RascunhoCadastro | null>(null);
  const [pronto, setPronto] = useState(false);
  const [logo, setLogo] = useState<File | null>(null);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      clinicaNome: "",
      endereco: "",
      tipoDocumento: "cnpj",
      documento: "",
      tema: "azul-padrao",
    },
  });

  const tipoDocumento = useWatch({
    control: form.control,
    name: "tipoDocumento",
  });

  useEffect(() => {
    const r = lerRascunhoCadastro();
    if (!r) {
      router.replace("/cadastro");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratação do rascunho client-only
    setRascunho(r);
    setPronto(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só na montagem
  }, []);

  async function onSubmit(values: FormValues) {
    if (!rascunho) {
      router.replace("/cadastro");
      return;
    }

    setErroGeral(null);

    let logoBase64: string | undefined;
    let logoContentType: string | undefined;
    let logoFileName: string | undefined;
    if (logo) {
      logoBase64 = await fileToBase64(logo);
      logoContentType = logo.type;
      logoFileName = logo.name;
    }

    const result = await concluirCadastro({
      admin: {
        nome: rascunho.adminNome,
        email: rascunho.email,
        senha: rascunho.senha,
      },
      clinica: {
        nome: values.clinicaNome,
        endereco: values.endereco,
        tipoDocumento: values.tipoDocumento,
        documento: values.documento,
      },
      planoId: rascunho.planoId,
      tema: values.tema,
      logoBase64,
      logoContentType,
      logoFileName,
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

    limparRascunhoCadastro();

    const { error: loginError } = await authClient.signIn.email({
      email: rascunho.email,
      password: rascunho.senha,
    });

    if (loginError) {
      window.location.assign("/login?cadastro=ok");
      return;
    }

    window.location.assign("/dashboard");
  }

  if (!pronto || !rascunho) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Carregando…
      </p>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-5"
        noValidate
      >
        <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          Conta:{" "}
          <span className="font-medium text-foreground">{rascunho.email}</span>
          {" · "}
          Plano:{" "}
          <span className="font-medium text-foreground">
            {rascunho.planoId.replace("plano-", "")}
          </span>
        </div>

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
                <Select value={field.value} onValueChange={field.onChange}>
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

        <LogoUploadField value={logo} onChange={setLogo} />

        <div className="space-y-3">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Tema visual
          </p>
          <FormField
            control={form.control}
            name="tema"
            render={({ field }) => (
              <FormItem>
                <TemaClinicaPicker
                  value={field.value as TemaClinica}
                  onChange={field.onChange}
                />
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
          idleLabel="Criar clínica e entrar"
          loadingLabel="Criando clínica…"
        />
      </form>
    </Form>
  );
}
