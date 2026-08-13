"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { listarNotificacoesNaoLidasAction } from "@/actions/listar-notificacoes-nao-lidas";
import { marcarNotificacaoComoLidaAction } from "@/actions/marcar-notificacao-como-lida";
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

/** Polling in-app de não lidas (spec 011) — compartilhado pelo shell e Configurações. */
export function useNotificacoesNaoLidas() {
  return useQuery({
    queryKey: NOTIFICACOES_QUERY_KEY,
    queryFn: fetchNotificacoesNaoLidas,
    refetchInterval: POLLING_MS,
  });
}

/**
 * Marca como lida item a item (não há operação de lote no backend).
 * Atualiza o cache da query compartilhada para o sino e a aba ficarem em sincronia.
 */
export function useMarcarNotificacoesComoLidas() {
  const queryClient = useQueryClient();
  const [marcandoId, setMarcandoId] = useState<string | null>(null);
  const [marcandoTodas, setMarcandoTodas] = useState(false);

  async function executar(ids: string[]) {
    if (ids.length === 0) return;

    const previous = queryClient.getQueryData<NotificacaoDashboardDTO[]>(
      NOTIFICACOES_QUERY_KEY,
    );
    queryClient.setQueryData<NotificacaoDashboardDTO[]>(
      NOTIFICACOES_QUERY_KEY,
      (atual) => (atual ?? []).filter((n) => !ids.includes(n.id)),
    );

    try {
      for (const id of ids) {
        const result = await marcarNotificacaoComoLidaAction({
          notificacaoId: id,
        });
        if (result.serverError) {
          throw new Error(result.serverError.mensagem);
        }
      }
    } catch (erro) {
      if (previous !== undefined) {
        queryClient.setQueryData(NOTIFICACOES_QUERY_KEY, previous);
      }
      throw erro;
    } finally {
      await queryClient.invalidateQueries({ queryKey: NOTIFICACOES_QUERY_KEY });
    }
  }

  async function marcarUma(id: string) {
    setMarcandoId(id);
    try {
      await executar([id]);
    } finally {
      setMarcandoId(null);
    }
  }

  async function marcarTodas(ids: string[]) {
    setMarcandoTodas(true);
    try {
      await executar(ids);
    } finally {
      setMarcandoTodas(false);
    }
  }

  return { marcarUma, marcarTodas, marcandoId, marcandoTodas };
}
