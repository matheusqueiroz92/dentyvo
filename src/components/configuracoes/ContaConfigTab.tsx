"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { atualizarPerfilProprioAction } from "@/actions/atualizar-perfil-proprio";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";

const schemaNome = z.object({
  nome: z.string().trim().min(1, "Informe o seu nome."),
});

const schemaSenha = z
  .object({
    senhaAtual: z.string().min(1, "Informe a senha atual."),
    senhaNova: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
    senhaNovaConfirmacao: z.string().min(1, "Confirme a nova senha."),
  })
  .refine((valores) => valores.senhaNova === valores.senhaNovaConfirmacao, {
    message: "As senhas não coincidem.",
    path: ["senhaNovaConfirmacao"],
  });

type ValoresNome = z.infer<typeof schemaNome>;
type ValoresSenha = z.infer<typeof schemaSenha>;

type ContaConfigTabProps = {
  nomeInicial: string;
};

function mensagemErroTrocaSenha(codigo?: string, mensagem?: string): string {
  if (
    codigo === "INVALID_PASSWORD" ||
    mensagem === "Invalid password" ||
    mensagem === "invalid password"
  ) {
    return "Senha atual incorreta.";
  }
  if (codigo === "CREDENTIAL_ACCOUNT_NOT_FOUND") {
    return "Esta conta entra com Google e não possui senha para alterar.";
  }
  if (codigo === "PASSWORD_TOO_SHORT") {
    return "A senha deve ter pelo menos 8 caracteres.";
  }
  return mensagem ?? "Não foi possível alterar a senha. Tente novamente.";
}

export function ContaConfigTab({ nomeInicial }: ContaConfigTabProps) {
  const router = useRouter();
  const [temSenhaCredential, setTemSenhaCredential] = useState<boolean | null>(
    null,
  );

  useEffect(() => {
    let cancelado = false;
    void (async () => {
      const { data, error } = await authClient.listAccounts();
      if (cancelado) return;
      if (error || !data) {
        setTemSenhaCredential(true);
        return;
      }
      const temCredential = data.some(
        (conta) => conta.providerId === "credential",
      );
      setTemSenhaCredential(temCredential);
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  const formNome = useForm<ValoresNome>({
    resolver: zodResolver(schemaNome),
    defaultValues: { nome: nomeInicial },
  });

  const formSenha = useForm<ValoresSenha>({
    resolver: zodResolver(schemaSenha),
    defaultValues: {
      senhaAtual: "",
      senhaNova: "",
      senhaNovaConfirmacao: "",
    },
  });

  async function onSubmitNome(valores: ValoresNome) {
    const result = await atualizarPerfilProprioAction({ nome: valores.nome });
    if (result.validationErrors) {
      formNome.setError("nome", { message: "Informe o seu nome." });
      formNome.setFocus("nome");
      return;
    }
    if (result.serverError || !result.data) {
      toast.error(
        result.serverError?.mensagem ?? "Não foi possível atualizar o nome.",
      );
      formNome.setFocus("nome");
      return;
    }
    formNome.reset({ nome: result.data.nome });
    toast.success("Nome atualizado.");
    router.refresh();
  }

  async function onSubmitSenha(valores: ValoresSenha) {
    const { error } = await authClient.changePassword({
      currentPassword: valores.senhaAtual,
      newPassword: valores.senhaNova,
      revokeOtherSessions: true,
    });
    if (error) {
      if (error.code === "CREDENTIAL_ACCOUNT_NOT_FOUND") {
        setTemSenhaCredential(false);
      }
      const mensagem = mensagemErroTrocaSenha(error.code, error.message);
      formSenha.setError("senhaAtual", { message: mensagem });
      formSenha.setFocus("senhaAtual");
      return;
    }
    formSenha.reset();
    toast.success("Senha alterada. Outras sessões foram encerradas.");
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nome</CardTitle>
          <CardDescription>
            Como você aparece no painel, na equipe e em documentos novos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...formNome}>
            <form
              className="space-y-4"
              onSubmit={formNome.handleSubmit(onSubmitNome, () => {
                formNome.setFocus("nome");
              })}
              noValidate
            >
              <FormField
                control={formNome.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete="name"
                        className="min-h-11"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="min-h-11"
                disabled={formNome.formState.isSubmitting}
              >
                {formNome.formState.isSubmitting
                  ? "Salvando…"
                  : "Salvar nome"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {temSenhaCredential === null ? (
        <div
          className="space-y-3"
          aria-busy="true"
          aria-label="Carregando opções de senha"
        >
          <Skeleton className="h-11 w-40" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : temSenhaCredential ? (
        <Card>
          <CardHeader>
            <CardTitle>Senha</CardTitle>
            <CardDescription>
              Informe a senha atual para definir uma nova. As outras sessões
              desta conta serão encerradas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...formSenha}>
              <form
                className="space-y-4"
                onSubmit={formSenha.handleSubmit(onSubmitSenha, (erros) => {
                  if (erros.senhaAtual) {
                    formSenha.setFocus("senhaAtual");
                    return;
                  }
                  if (erros.senhaNova) {
                    formSenha.setFocus("senhaNova");
                    return;
                  }
                  formSenha.setFocus("senhaNovaConfirmacao");
                })}
                noValidate
              >
                <FormField
                  control={formSenha.control}
                  name="senhaAtual"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha atual</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="current-password"
                          className="min-h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={formSenha.control}
                  name="senhaNova"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nova senha</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="new-password"
                          className="min-h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={formSenha.control}
                  name="senhaNovaConfirmacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar nova senha</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="new-password"
                          className="min-h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="min-h-11"
                  disabled={formSenha.formState.isSubmitting}
                >
                  {formSenha.formState.isSubmitting
                    ? "Alterando…"
                    : "Alterar senha"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Senha</CardTitle>
            <CardDescription>
              Esta conta entra com Google e não possui senha para alterar.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
