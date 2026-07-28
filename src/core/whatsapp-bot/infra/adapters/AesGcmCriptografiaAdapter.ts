import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

import type { CriptografiaPort } from "../../application/ports/CriptografiaPort";

const ALGORITMO = "aes-256-gcm";
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;

/**
 * Criptografia AES-256-GCM para o access token WhatsApp em repouso (spec 008).
 * Chave: `WHATSAPP_TOKEN_ENCRYPTION_KEY` — 32 bytes em base64 (ver `.env.example`).
 *
 * Formato persistido: `base64(iv).base64(authTag).base64(ciphertext)`
 */
export class AesGcmCriptografiaAdapter implements CriptografiaPort {
  private readonly chave: Buffer;

  constructor(chaveBase64?: string) {
    const bruto =
      chaveBase64 ?? process.env.WHATSAPP_TOKEN_ENCRYPTION_KEY ?? "";
    if (!bruto.trim()) {
      throw new Error(
        "WHATSAPP_TOKEN_ENCRYPTION_KEY não definida (32 bytes em base64).",
      );
    }

    const chave = Buffer.from(bruto.trim(), "base64");
    if (chave.length !== 32) {
      throw new Error(
        "WHATSAPP_TOKEN_ENCRYPTION_KEY deve decodificar para exatamente 32 bytes.",
      );
    }
    this.chave = chave;
  }

  async criptografar(textoPlano: string): Promise<string> {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITMO, this.chave, iv);
    const ciphertext = Buffer.concat([
      cipher.update(textoPlano, "utf8"),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return [
      iv.toString("base64"),
      authTag.toString("base64"),
      ciphertext.toString("base64"),
    ].join(".");
  }

  async descriptografar(textoCriptografado: string): Promise<string> {
    const partes = textoCriptografado.split(".");
    if (partes.length !== 3) {
      throw new Error("Ciphertext WhatsApp em formato inválido.");
    }

    const [ivB64, tagB64, dataB64] = partes;
    const iv = Buffer.from(ivB64!, "base64");
    const authTag = Buffer.from(tagB64!, "base64");
    const ciphertext = Buffer.from(dataB64!, "base64");

    if (iv.length !== IV_BYTES || authTag.length !== AUTH_TAG_BYTES) {
      throw new Error("Ciphertext WhatsApp com IV/authTag inválidos.");
    }

    const decipher = createDecipheriv(ALGORITMO, this.chave, iv);
    decipher.setAuthTag(authTag);
    const plano = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return plano.toString("utf8");
  }
}
