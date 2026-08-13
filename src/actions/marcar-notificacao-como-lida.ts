"use server";

import { z } from "zod";

import { ObterContextoSessao } from "@/core/auth/application/use-cases/ObterContextoSessao";
import { createAuthModule } from "@/core/auth/infra/create-auth-module";
import { destinatarioUsuario } from "@/core/notificacao/domain/DestinatarioNotificacao";
import { createNotificacaoModule } from "@/core/notificacao/infra/create-notificacao-module";
import { actionClient } from "@/lib/safe-action";

/**
 * Marca uma notificação como lida — só o destinatário da sessão (spec 011).
 */
export const marcarNotificacaoComoLidaAction = actionClient
  .inputSchema(z.object({ notificacaoId: z.string().min(1) }))
  .action(async ({ parsedInput }): Promise<{ id: string; lida: boolean }> => {
    const auth = createAuthModule();
    const ctx = await new ObterContextoSessao(auth.authPort).executar();
    if (!ctx) {
      throw new Error("Sessão expirada. Faça login novamente.");
    }

    const { marcarComoLida } = createNotificacaoModule();
    const atualizada = await marcarComoLida.executar({
      notificacaoId: parsedInput.notificacaoId,
      destinatarioSessao: destinatarioUsuario(ctx.usuarioId),
    });

    return { id: atualizada.id, lida: atualizada.lida };
  });
