"use client";

import { AbaAgendamentoOnline } from "@/components/configuracoes/AbaAgendamentoOnline";
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
};

export function ConfiguracoesClient({ papel }: Props) {
  const isAdmin = papel === "admin";

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Preferências da clínica, notificações e canais de agendamento.
        </p>
      </div>

      <Tabs defaultValue={isAdmin ? "geral" : "notificacoes"}>
        <TabsList variant="line" className="h-auto w-full justify-start gap-1">
          {isAdmin ? (
            <TabsTrigger value="geral" className="min-h-11 px-3">
              Geral
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
          <TabsContent value="agendamento-online" className="pt-4">
            <AbaAgendamentoOnline />
          </TabsContent>
        ) : null}

        <TabsContent value="notificacoes" className="pt-4">
          <NotificacoesConfigTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
