"use client";

import { toast } from "sonner";

import { ListaNotificacoes } from "@/components/configuracoes/ListaNotificacoes";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useMarcarNotificacoesComoLidas,
  useNotificacoesNaoLidas,
} from "@/hooks/use-notificacoes-nao-lidas";

export function NotificacoesConfigTab() {
  const { data, isPending, isError, error } = useNotificacoesNaoLidas();
  const { marcarUma, marcarTodas, marcandoId, marcandoTodas } =
    useMarcarNotificacoesComoLidas();
  const itens = data ?? [];

  async function aoMarcarUma(id: string) {
    try {
      await marcarUma(id);
    } catch (erro) {
      toast.error(
        erro instanceof Error
          ? erro.message
          : "Não foi possível marcar a notificação como lida.",
      );
    }
  }

  async function aoMarcarTodas() {
    try {
      await marcarTodas(itens.map((n) => n.id));
    } catch (erro) {
      toast.error(
        erro instanceof Error
          ? erro.message
          : "Não foi possível marcar as notificações como lidas.",
      );
    }
  }

  if (isPending) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Carregando notificações">
        <Skeleton className="h-11 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Não foi possível carregar as notificações</AlertTitle>
        <AlertDescription>
          {error instanceof Error
            ? error.message
            : "Tente novamente em instantes."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">Notificações pendentes</h2>
        <p className="text-sm text-muted-foreground">
          Avisos in-app desta conta. Marcar como lida atualiza também o sino do
          painel.
        </p>
      </div>
      <ListaNotificacoes
        itens={itens}
        onMarcarComoLida={(id) => void aoMarcarUma(id)}
        onMarcarTodas={() => void aoMarcarTodas()}
        marcandoId={marcandoId}
        marcandoTodas={marcandoTodas}
      />
    </div>
  );
}
