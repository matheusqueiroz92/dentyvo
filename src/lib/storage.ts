import { put } from "@vercel/blob";

export type UploadArquivoInput = {
  /** Caminho lógico no Blob (ex.: `clinicas/{id}/logo.png`). */
  pathname: string;
  body: Parameters<typeof put>[1];
  contentType?: string;
};

export type UploadArquivoResultado = {
  url: string;
  pathname: string;
  contentType: string;
};

/**
 * Adapter transversal de upload via Vercel Blob Storage.
 *
 * Usado primeiro para logo da clínica; reaproveitável para anexos de
 * prontuário e outros binários (ver `specs/01-architecture.md`).
 * Fica fora de `src/core/*` — infraestrutura compartilhada, sem regra de negócio.
 */
export class BlobStorageAdapter {
  constructor(
    private readonly token: string | undefined = process.env
      .BLOB_READ_WRITE_TOKEN,
  ) {}

  async upload(input: UploadArquivoInput): Promise<UploadArquivoResultado> {
    if (!this.token?.trim()) {
      throw new Error(
        "BLOB_READ_WRITE_TOKEN não configurada. Defina em .env.local.",
      );
    }

    const blob = await put(input.pathname, input.body, {
      access: "public",
      token: this.token,
      contentType: input.contentType,
    });

    return {
      url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType,
    };
  }
}
