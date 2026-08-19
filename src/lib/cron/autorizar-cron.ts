import { timingSafeEqual } from "node:crypto";

const ESQUEMA = "Bearer ";

/**
 * Autoriza chamadas de scheduler (Vercel Cron envia
 * `Authorization: Bearer $CRON_SECRET`).
 *
 * Segredo ausente no ambiente nega tudo — um cron desprotegido é pior do que
 * um cron que não roda, porque exporia o job a disparo por terceiros.
 */
export function cronAutorizado(
  headerAutorizacao: string | null | undefined,
  segredo: string | undefined,
): boolean {
  const esperado = segredo?.trim() ?? "";
  if (!esperado) {
    return false;
  }

  const header = headerAutorizacao ?? "";
  if (!header.startsWith(ESQUEMA)) {
    return false;
  }

  const recebido = Buffer.from(header.slice(ESQUEMA.length), "utf8");
  const alvo = Buffer.from(esperado, "utf8");
  if (recebido.length !== alvo.length) {
    return false;
  }
  return timingSafeEqual(recebido, alvo);
}
