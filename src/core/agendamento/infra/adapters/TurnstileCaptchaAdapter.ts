import type { CaptchaPort } from "../../application/ports/CaptchaPort";

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Cloudflare Turnstile — siteverify no servidor.
 * Em desenvolvimento, se `TURNSTILE_SECRET_KEY` estiver ausente e
 * `TURNSTILE_BYPASS=1`, aceita qualquer token (não usar em produção).
 */
export class TurnstileCaptchaAdapter implements CaptchaPort {
  constructor(
    private readonly secretKey: string | undefined = process.env
      .TURNSTILE_SECRET_KEY,
  ) {}

  async verificar(token: string, remoteIp?: string): Promise<boolean> {
    if (!token?.trim()) {
      return false;
    }

    // Sem secret em não-produção: bypass para dev/local (nunca em production).
    if (!this.secretKey) {
      return process.env.NODE_ENV !== "production";
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
