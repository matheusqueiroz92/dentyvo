import type { CaptchaPort } from "../../application/ports/CaptchaPort";

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const MENSAGEM_SECRET_AUSENTE =
  "TURNSTILE_SECRET_KEY não configurada";

/**
 * Cloudflare Turnstile — siteverify no servidor.
 *
 * Bypass (aceitar qualquer token não vazio) ocorre **apenas** quando
 * `NODE_ENV === "development"` e a secret está ausente. Em qualquer outro
 * ambiente (test, staging, preview Vercel, production), ausência da secret
 * falha alto — nunca aceita token silenciosamente.
 */
export class TurnstileCaptchaAdapter implements CaptchaPort {
  constructor(
    private readonly secretKey: string | undefined = process.env
      .TURNSTILE_SECRET_KEY,
    private readonly nodeEnv: string | undefined = process.env.NODE_ENV,
  ) {}

  async verificar(token: string, remoteIp?: string): Promise<boolean> {
    if (!token?.trim()) {
      return false;
    }

    if (!this.secretKey?.trim()) {
      if (this.nodeEnv === "development") {
        return true;
      }
      throw new Error(MENSAGEM_SECRET_AUSENTE);
    }

    const body = new URLSearchParams();
    body.set("secret", this.secretKey);
    body.set("response", token);
    if (remoteIp) {
      body.set("remoteip", remoteIp);
    }

    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      body,
    });
    if (!res.ok) {
      return false;
    }
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  }
}
