/**
 * Integração com Meta Graph API / WhatsApp Cloud API (spec 008).
 * Implementação concreta fica em `infra/adapters` (fora do escopo deste passo).
 */
export type ResultadoTrocaCodigoMeta = {
  accessToken: string;
  /** Expiração do token de longa duração. */
  expiraEm: Date;
  wabaId: string;
  phoneNumberId: string;
};

export type ResultadoRenovacaoTokenMeta = {
  accessToken: string;
  expiraEm: Date;
};

export interface MetaGraphApiPort {
  trocarCodigoPorToken(codigoOAuth: string): Promise<ResultadoTrocaCodigoMeta>;

  inscreverWebhook(input: {
    phoneNumberId: string;
    accessToken: string;
  }): Promise<void>;

  renovarToken(accessToken: string): Promise<ResultadoRenovacaoTokenMeta>;
}
