"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

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
import { Textarea } from "@/components/ui/textarea";
import { enviarMensagemContato } from "@/lib/contato/enviar";
import {
  contatoLandingSchema,
  contatoSuporteSchema,
  type ContatoLandingValues,
  type ContatoSuporteValues,
} from "@/lib/contato/schema";
import { cn } from "@/lib/utils";

const MENSAGEM_ENVIO =
  "Vamos abrir seu aplicativo de e-mail para enviar a mensagem. Se não abrir, use os canais de e-mail ou WhatsApp.";

type ContatoFormProps =
  | { variante: "landing" }
  | { variante: "suporte"; nomePadrao: string };

export function ContatoForm(props: ContatoFormProps) {
  if (props.variante === "suporte") {
    return <FormularioSuporte nomePadrao={props.nomePadrao} />;
  }
  return <FormularioLanding />;
}

function FormularioLanding() {
  const [enviado, setEnviado] = useState(false);
  const form = useForm<ContatoLandingValues>({
    resolver: zodResolver(contatoLandingSchema),
    defaultValues: { nome: "", email: "", mensagem: "" },
  });

  function onSubmit(values: ContatoLandingValues) {
    enviarMensagemContato({
      nome: values.nome,
      email: values.email,
      mensagem: values.mensagem,
    });
    setEnviado(true);
  }

  return (
    <Form {...form}>
      <form
        className="space-y-5"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
      >
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  autoComplete="name"
                  placeholder="Seu nome"
                  className="min-h-11"
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
                  placeholder="voce@clinica.com.br"
                  className="min-h-11"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="mensagem"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mensagem</FormLabel>
              <FormControl>
                <Textarea
                  rows={5}
                  placeholder="Como podemos ajudar?"
                  className="min-h-30"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <RodapeEnvio enviado={enviado} />
      </form>
    </Form>
  );
}

function FormularioSuporte({ nomePadrao }: { nomePadrao: string }) {
  const [enviado, setEnviado] = useState(false);
  const form = useForm<ContatoSuporteValues>({
    resolver: zodResolver(contatoSuporteSchema),
    defaultValues: {
      nome: nomePadrao,
      assunto: "",
      descricao: "",
      tipo: "duvida",
    },
  });

  function onSubmit(values: ContatoSuporteValues) {
    enviarMensagemContato({
      nome: values.nome,
      assunto: values.assunto,
      mensagem: values.descricao,
      tipo: values.tipo,
    });
    setEnviado(true);
  }

  return (
    <Form {...form}>
      <form
        className="space-y-5"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
      >
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  autoComplete="name"
                  className="min-h-11"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tipo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <div
                className="grid grid-cols-2 gap-3"
                role="radiogroup"
                aria-label="Tipo"
              >
                {(
                  [
                    { valor: "duvida", rotulo: "Dúvida" },
                    { valor: "bug", rotulo: "Bug" },
                  ] as const
                ).map((opcao) => (
                  <label
                    key={opcao.valor}
                    className={cn(
                      "flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-input bg-card px-3 text-sm",
                      field.value === opcao.valor &&
                        "border-primary bg-primary/5",
                    )}
                  >
                    <input
                      type="radio"
                      name={field.name}
                      value={opcao.valor}
                      checked={field.value === opcao.valor}
                      onChange={() => field.onChange(opcao.valor)}
                      className="size-4 accent-primary"
                    />
                    {opcao.rotulo}
                  </label>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="assunto"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assunto</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Resumo do que aconteceu"
                  className="min-h-11"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea
                  rows={5}
                  placeholder="Detalhe o problema ou a dúvida"
                  className="min-h-30"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <RodapeEnvio enviado={enviado} />
      </form>
    </Form>
  );
}

function RodapeEnvio({ enviado }: { enviado: boolean }) {
  return (
    <div className="space-y-2">
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="min-h-11 w-full sm:w-auto"
      >
        Enviar mensagem
      </Button>
      <p
        role={enviado ? "status" : undefined}
        className="text-xs leading-4.5 text-muted-foreground"
      >
        {enviado ? "Mensagem pronta para envio no seu e-mail." : MENSAGEM_ENVIO}
      </p>
    </div>
  );
}
