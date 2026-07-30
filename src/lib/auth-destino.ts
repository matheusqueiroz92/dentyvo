export type DestinoAuth = "/dashboard" | "/admin";

export type AuthDestinoLookups = {
  buscarUsuarioPlataformaPorId: (id: string) => Promise<unknown | null>;
  buscarUsuarioPlataformaPorEmail: (email: string) => Promise<unknown | null>;
  buscarProfissionalPorUsuarioId: (
    usuarioId: string,
  ) => Promise<unknown | null>;
};

/** Mensagem amigável quando Google/social não encontra conta de clínica/plataforma. */
export const MENSAGEM_CONTA_SOCIAL_NAO_ENCONTRADA =
  "Nenhuma conta encontrada para este e-mail. Cadastre sua clínica primeiro.";

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
