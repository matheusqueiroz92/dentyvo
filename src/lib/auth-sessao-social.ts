/**
 * Regra do hook `session.create.before` no BetterAuth.
 * Login social unificado: sessão é sempre permitida — conta sem
 * Profissional/UsuarioPlataforma segue para onboarding em `/auth/continuar`.
 *
 * A assinatura mantém path/vínculo para o contrato testado; o destino
 * pós-callback é resolvido em `resolverDestinoPosCallbackSocial`.
 */
export function deveAutorizarCriacaoSessaoSocial(input: {
  path: string;
  temVinculoAutorizado: boolean;
}): boolean {
  void input;
  return true;
}
