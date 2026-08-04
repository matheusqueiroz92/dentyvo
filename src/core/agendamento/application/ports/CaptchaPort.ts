/**
 * Verificação de CAPTCHA na borda (ex.: Cloudflare Turnstile).
 */
export interface CaptchaPort {
  verificar(token: string, remoteIp?: string): Promise<boolean>;
}
