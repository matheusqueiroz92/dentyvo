import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { account, session, user } from "@/db/schema";
import { usuarioTemVinculoAutorizado } from "@/lib/auth-destino.server";
import { processarLinkingSocialPorRisco } from "@/lib/auth-linking-risco";

/**
 * Invalida a senha credential sem apagar a conta — o dono legítimo pode
 * redefinir via "esqueci a senha". Prefixo garante que nenhum hash válido
 * da lib case com o valor.
 */
export async function invalidarSenhaCredential(
  usuarioId: string,
  database: typeof db = db,
): Promise<void> {
  await database
    .update(account)
    .set({ password: `INVALIDATED.${randomUUID()}` })
    .where(
      and(eq(account.userId, usuarioId), eq(account.providerId, "credential")),
    );
}

export async function revogarSessoesDoUsuario(
  usuarioId: string,
  database: typeof db = db,
): Promise<void> {
  await database.delete(session).where(eq(session.userId, usuarioId));
}

/**
 * Chamado em `databaseHooks.account.create.before` ao criar conta OAuth.
 * Conta completa + e-mail não verificado + senha → neutraliza takeover.
 */
export async function aplicarPoliticaLinkingSocialAntesDeCriarConta(input: {
  userId: string;
  providerId: string;
}): Promise<void> {
  if (input.providerId === "credential") return;

  const [usuario, temVinculo, contas] = await Promise.all([
    db.query.user.findFirst({
      where: eq(user.id, input.userId),
      columns: { emailVerified: true },
    }),
    usuarioTemVinculoAutorizado(input.userId),
    db.query.account.findMany({
      where: eq(account.userId, input.userId),
      columns: { providerId: true, password: true },
    }),
  ]);

  const temSenhaCredential = contas.some(
    (c) => c.providerId === "credential" && Boolean(c.password),
  );

  await processarLinkingSocialPorRisco(
    {
      usuarioId: input.userId,
      providerId: input.providerId,
      temClinicaOuPlataforma: temVinculo,
      emailVerificadoLocal: Boolean(usuario?.emailVerified),
      temSenhaCredential,
    },
    {
      revogarSessoes: revogarSessoesDoUsuario,
      invalidarSenhaCredential,
    },
  );
}
