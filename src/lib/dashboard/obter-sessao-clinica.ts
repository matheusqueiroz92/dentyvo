import { redirect } from "next/navigation";

import { ObterContextoSessao } from "@/core/auth/application/use-cases/ObterContextoSessao";
import type { ContextoSessao } from "@/core/auth/domain/ContextoSessao";
import { createAuthModule } from "@/core/auth/infra/create-auth-module";

/** Sessão da clínica ou redireciona para login. */
export async function requireSessaoClinica(): Promise<ContextoSessao> {
  const auth = createAuthModule();
  const ctx = await new ObterContextoSessao(auth.authPort).executar();
  if (!ctx) {
    redirect("/login");
  }
  return ctx;
}
