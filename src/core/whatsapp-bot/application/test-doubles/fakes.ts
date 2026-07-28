import type { ClinicWhatsappAccount } from "../../domain/ClinicWhatsappAccount";
import type { ClinicWhatsappAccountRepositoryPort } from "../ports/ClinicWhatsappAccountRepositoryPort";
import type { CriptografiaPort } from "../ports/CriptografiaPort";
import type {
  MetaGraphApiPort,
  ResultadoRenovacaoTokenMeta,
  ResultadoTrocaCodigoMeta,
} from "../ports/MetaGraphApiPort";
import { CodigoOAuthInvalidoError } from "../../domain/errors";

export class FakeClinicWhatsappAccountRepository
  implements ClinicWhatsappAccountRepositoryPort
{
  readonly items = new Map<string, ClinicWhatsappAccount>();

  async salvar(conta: ClinicWhatsappAccount): Promise<void> {
    this.items.set(conta.clinicaId, conta);
  }

  async buscarPorClinicaId(
    clinicaId: string,
  ): Promise<ClinicWhatsappAccount | null> {
    return this.items.get(clinicaId) ?? null;
  }

  async buscarPorPhoneNumberId(
    phoneNumberId: string,
  ): Promise<ClinicWhatsappAccount | null> {
    return (
      [...this.items.values()].find((c) => c.phoneNumberId === phoneNumberId) ??
      null
    );
  }

  async listarConectadasComTokenExpirandoAte(
    limiteExpiracao: Date,
  ): Promise<ClinicWhatsappAccount[]> {
    return [...this.items.values()].filter(
      (c) =>
        c.status === "conectado" &&
        c.tokenExpiraEm != null &&
        c.tokenExpiraEm.getTime() <= limiteExpiracao.getTime(),
    );
  }
}

export class FakeCriptografiaPort implements CriptografiaPort {
  readonly prefixo = "enc:";

  async criptografar(textoPlano: string): Promise<string> {
    return `${this.prefixo}${textoPlano}`;
  }

  async descriptografar(textoCriptografado: string): Promise<string> {
    if (!textoCriptografado.startsWith(this.prefixo)) {
      throw new Error("Ciphertext inválido no fake de criptografia.");
    }
    return textoCriptografado.slice(this.prefixo.length);
  }
}

export type FakeMetaGraphApiOptions = {
  troca?: ResultadoTrocaCodigoMeta;
  renovacao?: ResultadoRenovacaoTokenMeta;
  falharTroca?: boolean;
  falharRenovacao?: boolean;
  falharWebhook?: boolean;
};

export class FakeMetaGraphApiPort implements MetaGraphApiPort {
  trocas: string[] = [];
  webhooks: Array<{
    wabaId: string;
    phoneNumberId: string;
    accessToken: string;
  }> = [];
  renovacoes: string[] = [];

  constructor(private readonly options: FakeMetaGraphApiOptions = {}) {}

  async trocarCodigoPorToken(
    codigoOAuth: string,
  ): Promise<ResultadoTrocaCodigoMeta> {
    this.trocas.push(codigoOAuth);
    if (this.options.falharTroca) {
      throw new CodigoOAuthInvalidoError();
    }
    return (
      this.options.troca ?? {
        accessToken: "token-longo-meta",
        expiraEm: new Date("2030-01-01T00:00:00.000Z"),
        wabaId: "waba-1",
        phoneNumberId: "phone-1",
      }
    );
  }

  async inscreverWebhook(input: {
    wabaId: string;
    phoneNumberId: string;
    accessToken: string;
  }): Promise<void> {
    if (this.options.falharWebhook) {
      throw new Error("Falha ao insccrever webhook.");
    }
    this.webhooks.push(input);
  }

  async renovarToken(accessToken: string): Promise<ResultadoRenovacaoTokenMeta> {
    this.renovacoes.push(accessToken);
    if (this.options.falharRenovacao) {
      throw new Error("Falha ao renovar token na Meta.");
    }
    return (
      this.options.renovacao ?? {
        accessToken: `${accessToken}-renovado`,
        expiraEm: new Date("2031-01-01T00:00:00.000Z"),
      }
    );
  }
}
