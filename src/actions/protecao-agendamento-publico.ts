import type { CaptchaPort } from "@/core/agendamento/application/ports/CaptchaPort";
import type { RateLimitPort } from "@/core/agendamento/application/ports/RateLimitPort";
import {
  CaptchaInvalidoError,
  RateLimitExcedidoError,
} from "@/core/agendamento/domain/errors";

export function chaveRateLimitPublico(ip: string, slug: string): string {
  return `${ip}:${slug}`;
}

export async function assertRateLimitPublico(
  rateLimit: RateLimitPort,
  chave: string,
): Promise<void> {
  const ok = await rateLimit.permitir(chave);
  if (!ok) {
    throw new RateLimitExcedidoError(chave);
  }
}

export async function assertCaptchaPublico(
  captcha: CaptchaPort,
  token: string,
  remoteIp?: string,
): Promise<void> {
  const ok = await captcha.verificar(token, remoteIp);
  if (!ok) {
    throw new CaptchaInvalidoError();
  }
}
