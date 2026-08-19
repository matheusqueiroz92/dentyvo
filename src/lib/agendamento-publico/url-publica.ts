/** Domínio de produção da plataforma. */
export const DOMINIO_PUBLICO = "dentyvo.com.br";

/** Rótulo compacto (sem esquema) para exibir links copiáveis na UI. */
export function previewUrlPublica(path: string): string {
  return `${DOMINIO_PUBLICO}${path}`;
}

/**
 * URL absoluta do link público. Prefere a origem real do browser para que
 * preview/staging copiem o próprio host, e só recorre ao domínio de produção
 * quando não há origem (ex.: render no servidor).
 */
export function urlPublicaAbsoluta(path: string, origem?: string): string {
  const base = origem?.trim() || `https://${DOMINIO_PUBLICO}`;
  return `${base}${path}`;
}
