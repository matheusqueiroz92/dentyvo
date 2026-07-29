import { db } from "@/db";
import { DrizzleAuditoriaLogPort } from "@/core/prontuario/infra/adapters";

import {
  EnviarNotificacao,
  ListarNotificacoesNaoLidas,
  MarcarComoLida,
} from "../application/use-cases";
import {
  CompositeNotificacaoCanalAdapter,
  DrizzleNotificacaoRepository,
} from "./adapters";

/** Composition root do módulo notificação (spec 011). */
export function createNotificacaoModule() {
  const repo = new DrizzleNotificacaoRepository(db);
  const canais = new CompositeNotificacaoCanalAdapter();
  const auditoria = new DrizzleAuditoriaLogPort(db);

  return {
    repo,
    canais,
    auditoria,
    enviarNotificacao: new EnviarNotificacao(repo, canais, auditoria),
    listarNotificacoesNaoLidas: new ListarNotificacoesNaoLidas(repo),
    marcarComoLida: new MarcarComoLida(repo),
  };
}
