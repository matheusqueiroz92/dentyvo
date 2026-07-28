import type { ContextoSessao } from "../../domain/ContextoSessao";
import type { AuthPort } from "../ports/AuthPort";

/**
 * Expõe o contexto da sessão atual (`usuarioId`, `clinicaId`, `papel`).
 * Login/logout permanecem no BetterAuth (delivery).
 */
export class ObterContextoSessao {
  constructor(private readonly auth: AuthPort) {}

  async executar(): Promise<ContextoSessao | null> {
    return this.auth.obterContextoSessao();
  }
}
