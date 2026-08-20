/**
 * Origem canônica da aplicação (`NEXT_PUBLIC_APP_URL`).
 * Sem host hardcoded: o domínio de produção muda (hoje o app vive em
 * `*.vercel.app`; depois `dentyvo.com.br`) só via variável de ambiente.
 */
export function origemPublicaDaApp(
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  const bruto = env.NEXT_PUBLIC_APP_URL?.trim() ?? "";
  if (!bruto) {
    return null;
  }
  const comEsquema = /^https?:\/\//i.test(bruto) ? bruto : `https://${bruto}`;
  return removerBarraFinal(comEsquema);
}

/** Rótulo compacto (sem esquema) para exibir links copiáveis na UI. */
export function previewUrlPublica(
  path: string,
  env: NodeJS.ProcessEnv = process.env,
): string {
  const origem = origemPublicaDaApp(env);
  if (!origem) {
    return path;
  }
  return `${origem.replace(/^https?:\/\//i, "")}${path}`;
}

/**
 * URL absoluta do link público.
 * Prioridade: `origem` explícita → `NEXT_PUBLIC_APP_URL`. Sem os dois,
 * devolve só o caminho — nunca inventa um domínio de produção.
 */
export function urlPublicaAbsoluta(
  path: string,
  origem?: string,
  env: NodeJS.ProcessEnv = process.env,
): string {
  const base = removerBarraFinal(origem ?? "") || origemPublicaDaApp(env);
  if (!base) {
    return path;
  }
  return `${base}${path}`;
}

function removerBarraFinal(valor: string): string {
  return valor.trim().replace(/\/+$/, "");
}
