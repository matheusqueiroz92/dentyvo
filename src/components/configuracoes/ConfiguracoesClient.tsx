"use client";

import { useState } from "react";

import { AbaAgendamentoOnline } from "@/components/configuracoes/AbaAgendamentoOnline";
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

export function ConfiguracoesClient({
  papel,
  nomeInicial,
  abaInicial,
}: Props) {
  const isAdmin = papel === "admin";
  const abaPadrao =
    abaInicial === "conta" ? "conta" : isAdmin ? "geral" : "notificacoes";
  const [aba, setAba] = useState(abaPadrao);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Preferências da clínica, conta, assinatura, notificações e canais de
          agendamento.
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
