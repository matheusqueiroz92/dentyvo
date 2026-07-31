"use client";

import { Bell, BellOff } from "lucide-react";

import { formatarDataCurta, formatarHorario } from "@/components/dashboard/formatacao";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotificacoesNaoLidas } from "@/hooks/use-notificacoes-nao-lidas";

import { ClientOnly } from "./ClientOnly";

function BellTriggerFallback() {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="relative min-h-11 min-w-11"
      aria-label="Notificações"
      disabled
    >
      <Bell aria-hidden />
    </Button>
  );
}

function NotificationsBellInner() {
  const { data, isPending, isError, error, isFetching } =
    useNotificacoesNaoLidas();
  const itens = data ?? [];
  const count = itens.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative min-h-11 min-w-11"
          aria-label={
            count === 0
              ? "Notificações — nenhuma não lida"
              : `Notificações — ${count} não lidas`
          }
        >
          <Bell aria-hidden />
          {count > 0 ? (
            <span
              className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground tabular-nums"
              aria-hidden
            >
              {count > 9 ? "9+" : count}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(100vw-2rem,22rem)] p-0" align="end">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Notificações</p>
          <p className="text-[12px] text-muted-foreground">
            {isFetching && !isPending ? "Atualizando…" : "Não lidas"}
          </p>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {isPending ? (
            <div className="flex flex-col gap-2 p-2" aria-busy="true">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : null}
          {isError ? (
            <p role="alert" className="px-3 py-6 text-center text-[13px] text-destructive">
              {error instanceof Error
                ? error.message
                : "Não foi possível carregar as notificações."}
            </p>
          ) : null}
          {!isPending && !isError && count === 0 ? (
            <EmptyState
              icon={BellOff}
              title="Nenhuma notificação não lida."
              className="py-8"
            />
          ) : null}
          {!isPending && !isError && count > 0 ? (
            <ul className="divide-y divide-border" role="list">
              {itens.map((n) => (
                <li key={n.id} className="flex flex-col gap-1 px-2 py-3">
                  <p className="text-sm font-medium">{n.titulo}</p>
                  {n.mensagem ? (
                    <p className="text-[13px] leading-5 text-muted-foreground">
                      {n.mensagem}
                    </p>
                  ) : null}
                  <time
                    dateTime={n.criadaEmIso}
                    className="text-[12px] text-muted-foreground tabular-nums"
                  >
                    {formatarDataCurta(n.criadaEmIso)} ·{" "}
                    {formatarHorario(n.criadaEmIso)}
                  </time>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function NotificationsBell() {
  return (
    <ClientOnly fallback={<BellTriggerFallback />}>
      <NotificationsBellInner />
    </ClientOnly>
  );
}
