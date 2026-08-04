import type { RateLimitPort } from "../../application/ports/RateLimitPort";

type Entrada = { count: number; resetAt: number };

/**
 * Fallback local quando Upstash Redis não está configurado (dev/test).
 * Não compartilha estado entre instâncias — só para desenvolvimento.
 */
export class InMemoryRateLimitAdapter implements RateLimitPort {
  private readonly janelas = new Map<string, Entrada>();

  constructor(
    private readonly limite: number = 30,
    private readonly janelaMs: number = 60_000,
  ) {}

  async permitir(chave: string): Promise<boolean> {
    const agora = Date.now();
    const atual = this.janelas.get(chave);
    if (!atual || atual.resetAt <= agora) {
      this.janelas.set(chave, { count: 1, resetAt: agora + this.janelaMs });
      return true;
    }
    if (atual.count >= this.limite) {
      return false;
    }
    atual.count += 1;
    return true;
  }
}
