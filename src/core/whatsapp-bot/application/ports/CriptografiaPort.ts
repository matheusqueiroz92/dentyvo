/**
 * Criptografia do access token em repouso (spec 008).
 * O domínio só manipula ciphertext; texto plano existe só transitoriamente
 * na application ao falar com a MetaGraphApiPort.
 */
export interface CriptografiaPort {
  criptografar(textoPlano: string): Promise<string>;
  descriptografar(textoCriptografado: string): Promise<string>;
}
