export type DestinoAuth = "/dashboard" | "/admin";

/** Destino após callback OAuth (app completo ou onboarding). */
export type DestinoPosCallbackSocial = DestinoAuth | "/cadastro" | "/login";

export type AuthDestinoLookups = {
  buscarUsuarioPlataformaPorId: (id: string) => Promise<unknown | null>;
  buscarUsuarioPlataformaPorEmail: (email: string) => Promise<unknown | null>;
  buscarProfissionalPorUsuarioId: (
    usuarioId: string,
  ) => Promise<unknown | null>;
};

/**
 * Resolve destino único do login social (independente da página de origem).
 * Conta completa → app; sem vínculo → onboarding em /cadastro.
 */
export function resolverDestinoPosCallbackSocial(input: {
  temSessao: boolean;
  destinoApp: DestinoAuth | null;
}): DestinoPosCallbackSocial {
  if (!input.temSessao) return "/login";
  if (input.destinoApp) return input.destinoApp;
  return "/cadastro";
}

/**
 * Destino pós-autenticação por tipo de identidade.
 * UsuarioPlataforma → /admin; Profissional → /dashboard; nenhum → null.
 * Puro (sem I/O) — seguro para testes e para import no client.
 */
export async function determinarDestinoAuth(
  lookups: AuthDestinoLookups,
  input: { usuarioId: string; email: string },
): Promise<DestinoAuth | null> {
  const email = input.email.trim().toLowerCase();

  const porId = await lookups.buscarUsuarioPlataformaPorId(input.usuarioId);
  if (porId) return "/admin";

  const porEmail = await lookups.buscarUsuarioPlataformaPorEmail(email);
  if (porEmail) return "/admin";

  const profissionalVinculado =
    await lookups.buscarProfissionalPorUsuarioId(input.usuarioId);
  if (profissionalVinculado) return "/dashboard";

  return null;
}
