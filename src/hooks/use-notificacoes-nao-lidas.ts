"use client";

import { useQuery } from "@tanstack/react-query";

import { listarNotificacoesNaoLidasAction } from "@/actions/listar-notificacoes-nao-lidas";
import type { NotificacaoDashboardDTO } from "@/lib/dashboard/types";

export const NOTIFICACOES_QUERY_KEY = ["notificacoes-nao-lidas"] as const;
const POLLING_MS = 30_000;

export async function fetchNotificacoesNaoLidas(): Promise<
  NotificacaoDashboardDTO[]
> {
  const result = await listarNotificacoesNaoLidasAction();
  if (result.serverError) {
    throw new Error(result.serverError.mensagem);
  }
  return result.data ?? [];
}

/** Polling in-app de não lidas (spec 011) — compartilhado pelo shell. */
export function useNotificacoesNaoLidas() {
  return useQuery({
    queryKey: NOTIFICACOES_QUERY_KEY,
    queryFn: fetchNotificacoesNaoLidas,
    refetchInterval: POLLING_MS,
  });
}
