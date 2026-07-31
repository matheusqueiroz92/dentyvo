"use client";

import { useQuery } from "@tanstack/react-query";
import { Bell, BellOff } from "lucide-react";

import { listarNotificacoesNaoLidasAction } from "@/actions/listar-notificacoes-nao-lidas";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { NotificacaoDashboardDTO } from "@/lib/dashboard/types";

import { BlocoErro } from "./BlocoErro";
import { formatarDataCurta, formatarHorario } from "./formatacao";

const POLLING_MS = 30_000;

async function fetchNotificacoes(): Promise<NotificacaoDashboardDTO[]> {
  const result = await listarNotificacoesNaoLidasAction();
  if (result.serverError) {
    throw new Error(result.serverError.mensagem);
  }
  return result.data ?? [];
}

export function NotificacoesCard() {
  const { data, isPending, isError, error, isFetching } = useQuery({
    queryKey: ["notificacoes-nao-lidas"],
    queryFn: fetchNotificacoes,
    refetchInterval: POLLING_MS,
  });

  if (isPending) {
    return (
      <Card aria-busy="true" aria-label="Carregando notificações">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="size-5" aria-hidden />
            Notificações
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <BlocoErro
        title="Notificações"
        mensagem={
          error instanceof Error
            ? error.message
            : "Não foi possível carregar as notificações."
        }
      />
    );
  }

  const itens = data ?? [];
  const count = itens.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="relative inline-flex">
                <Bell className="size-5" aria-hidden />
                {count > 0 ? (
                  <span
                    className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground tabular-nums"
                    aria-hidden
                  >
                    {count > 9 ? "9+" : count}
                  </span>
                ) : null}
              </span>
              Notificações
            </CardTitle>
            <CardDescription>
              Não lidas · atualiza a cada 30s
              {isFetching && !isPending ? " · atualizando…" : ""}
            </CardDescription>
          </div>
          <span className="sr-only">
            {count === 0
              ? "Nenhuma notificação não lida"
              : `${count} notificações não lidas`}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {count === 0 ? (
          <EmptyState
            icon={BellOff}
            title="Nenhuma notificação não lida."
            description="Avisos operacionais da clínica aparecem aqui."
          />
        ) : (
          <ul className="divide-y divide-border" role="list">
            {itens.map((n) => (
              <li key={n.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
                <p className="text-sm font-medium text-foreground">{n.titulo}</p>
                {n.mensagem ? (
                  <p className="text-[13px] leading-5 text-muted-foreground">
                    {n.mensagem}
                  </p>
                ) : null}
                <time
                  dateTime={n.criadaEmIso}
                  className="text-[12px] leading-[18px] text-muted-foreground tabular-nums"
                >
                  {formatarDataCurta(n.criadaEmIso)} ·{" "}
                  {formatarHorario(n.criadaEmIso)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
