/**
 * Proteção de abuso do canal público (chave tipicamente `ip:slug`).
 */
export interface RateLimitPort {
  /**
   * @returns `true` se a operação pode seguir; `false` se o limite foi excedido.
   */
  permitir(chave: string): Promise<boolean>;
}
