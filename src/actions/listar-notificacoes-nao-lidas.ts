"use server";

import { ObterContextoSessao } from "@/core/auth/application/use-cases/ObterContextoSessao";
import { createAuthModule } from "@/core/auth/infra/create-auth-module";
import { destinatarioUsuario } from "@/core/notificacao/domain/DestinatarioNotificacao";
import { createNotificacaoModule } from "@/core/notificacao/infra/create-notificacao-module";
import type { NotificacaoDashboardDTO } from "@/lib/dashboard/types";
import { actionClient } from "@/lib/safe-action";

/**
 * Lista notificações não lidas do usuário autenticado (polling in-app — spec 011).
 */
export const listarNotificacoesNaoLidasAction = actionClient.action(
  async (): Promise<NotificacaoDashboardDTO[]> => {
    const auth = createAuthModule();
    const ctx = await new ObterContextoSessao(auth.authPort).executar();
    if (!ctx) {
      throw new Error("Sessão expirada. Faça login novamente.");
    }

    const { listarNotificacoesNaoLidas } = createNotificacaoModule();
    const lista = await listarNotificacoesNaoLidas.executar({
      destinatarioSessao: destinatarioUsuario(ctx.usuarioId),
    });

    return lista.map((n) => ({
      id: n.id,
      titulo: n.conteudo.titulo ?? rotuloTipo(n.tipo),
      mensagem: n.conteudo.mensagem ?? "",
      criadaEmIso: n.criadaEm.toISOString(),
      linkAcao: n.conteudo.linkAcao ?? null,
    }));
  },
);

function rotuloTipo(tipo: string): string {
  const mapa: Record<string, string> = {
    aviso_aumento_preco: "Aviso de preço",
    lembrete_consulta: "Lembrete de consulta",
    trial_acabando: "Trial acabando",
    cobranca_vencida: "Cobrança vencida",
    convite_usuario: "Convite",
  };
  return mapa[tipo] ?? "Notificação";
}
