"use server";

import { z } from "zod";

import { AtualizarPerfilProprio } from "@/core/auth/application/use-cases";
import { ObterContextoSessao } from "@/core/auth/application/use-cases/ObterContextoSessao";
import { createAuthModule } from "@/core/auth/infra/create-auth-module";
import { actionClient } from "@/lib/safe-action";

const schema = z.object({
  nome: z.string().trim().min(1, "Informe o seu nome."),
});

export const atualizarPerfilProprioAction = actionClient
  .inputSchema(schema)
  .action(async ({ parsedInput }): Promise<{ nome: string }> => {
    const auth = createAuthModule();
    const ctx = await new ObterContextoSessao(auth.authPort).executar();
    if (!ctx) {
      throw new Error("Sessão expirada. Faça login novamente.");
    }

    const uc = new AtualizarPerfilProprio(
      auth.profissionalRepo,
      auth.authPort,
    );
    const profissional = await uc.executar({
      usuarioId: ctx.usuarioId,
      nome: parsedInput.nome,
    });
    return { nome: profissional.nome };
  });
