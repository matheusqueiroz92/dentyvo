/**
 * Regra do hook `session.create.before` no BetterAuth:
 * só rejeita criação de sessão no callback social sem vínculo
 * Profissional/UsuarioPlataforma.
 */
export function deveAutorizarCriacaoSessaoSocial(input: {
  path: string;
  temVinculoAutorizado: boolean;
}): boolean {
  const isSocialCallback =
    input.path.includes("/callback/") ||
    input.path.includes("/sign-in/social");

  if (!isSocialCallback) {
    return true;
  }

  return input.temVinculoAutorizado;
}
