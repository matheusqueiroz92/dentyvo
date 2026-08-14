import type { ContextoSessao } from "../../domain/ContextoSessao";

export type UsuarioAuth = {
  id: string;
  email: string;
  nome: string;
};

/**
 * Adapta o BetterAuth. Domain/application não importam a lib.
 * TTL de sessão (7 dias) é responsabilidade do adapter de infra.
 */
export interface AuthPort {
  criarUsuario(input: {
    nome: string;
    email: string;
    senha: string;
  }): Promise<UsuarioAuth>;

  buscarUsuarioPorEmail(email: string): Promise<UsuarioAuth | null>;

  obterContextoSessao(): Promise<ContextoSessao | null>;

  revogarSessoesDoUsuario(usuarioId: string): Promise<void>;

  /**
   * Atualiza `user.name` no BetterAuth. Domain/application não importam a lib.
   * Implementação concreta: adapter (`BetterAuthAuthPort`) — Implementador.
   */
  atualizarNome(usuarioId: string, nome: string): Promise<UsuarioAuth>;
}
