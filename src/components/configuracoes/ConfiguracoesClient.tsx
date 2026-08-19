"use client";

import { useState } from "react";

import { AbaAgendamentoOnline } from "@/components/configuracoes/AbaAgendamentoOnline";
import { AbaWhatsapp } from "@/components/configuracoes/AbaWhatsapp";
import { AssinaturaConfigTab } from "@/components/configuracoes/AssinaturaConfigTab";
import { ContaConfigTab } from "@/components/configuracoes/ContaConfigTab";
import { GeralConfigTab } from "@/components/configuracoes/GeralConfigTab";
import { NotificacoesConfigTab } from "@/components/configuracoes/NotificacoesConfigTab";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

type Props = {
  papel: string;
  nomeInicial: string;
  abaInicial?: string;
};

/** Abas exclusivas de admin — deep link é ignorado para os outros papéis. */
const ABAS_DE_ADMIN = ["geral", "assinatura", "agendamento-online", "whatsapp"];
const ABAS_ABERTAS = ["conta", "notificacoes"];

function resolverAbaInicial(abaInicial: string | undefined, isAdmin: boolean) {
  const padrao = isAdmin ? "geral" : "notificacoes";
  if (!abaInicial) {
    return padrao;
  }
  if (ABAS_ABERTAS.includes(abaInicial)) {
    return abaInicial;
  }
  if (isAdmin && ABAS_DE_ADMIN.includes(abaInicial)) {
    return abaInicial;
  }
  return padrao;
}

export function ConfiguracoesClient({
  papel,
  nomeInicial,
  abaInicial,
}: Props) {
  const isAdmin = papel === "admin";
  const [aba, setAba] = useState(() => resolverAbaInicial(abaInicial, isAdmin));

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Preferências da clínica, conta, assinatura, notificações, WhatsApp e
          canais de agendamento.
        </p>
      </div>

      <Tabs value={aba} onValueChange={setAba}>
        <TabsList variant="line" className="h-auto w-full justify-start gap-1">
          {isAdmin ? (
            <TabsTrigger value="geral" className="min-h-11 px-3">
              Geral
            </TabsTrigger>
          ) : null}
          {isAdmin ? (
            <TabsTrigger value="assinatura" className="min-h-11 px-3">
              Assinatura
            </TabsTrigger>
          ) : null}
          {isAdmin ? (
            <TabsTrigger
              value="agendamento-online"
              className="min-h-11 px-3"
            >
              Agendamento Online
            </TabsTrigger>
          ) : null}
          {isAdmin ? (
            <TabsTrigger value="whatsapp" className="min-h-11 px-3">
              WhatsApp
            </TabsTrigger>
          ) : null}
          <TabsTrigger value="conta" className="min-h-11 px-3">
            Conta
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="min-h-11 px-3">
            Notificações
          </TabsTrigger>
        </TabsList>

        {isAdmin ? (
          <TabsContent value="geral" className="pt-4">
            <GeralConfigTab />
          </TabsContent>
        ) : null}

        {isAdmin ? (
          <TabsContent value="assinatura" className="pt-4">
            <AssinaturaConfigTab />
          </TabsContent>
        ) : null}

        {isAdmin ? (
          <TabsContent value="agendamento-online" className="pt-4">
            <AbaAgendamentoOnline />
          </TabsContent>
        ) : null}

        {isAdmin ? (
          <TabsContent value="whatsapp" className="pt-4">
            <AbaWhatsapp />
          </TabsContent>
        ) : null}

        <TabsContent value="conta" className="pt-4">
          <ContaConfigTab nomeInicial={nomeInicial} />
        </TabsContent>

        <TabsContent value="notificacoes" className="pt-4">
          <NotificacoesConfigTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
