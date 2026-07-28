import {
  DadosInvalidosError,
  TenantMismatchError,
} from "@/core/shared/errors";

import {
  TokenWhatsappInvalidoError,
  WhatsappNaoConectadoError,
} from "./errors";
import type { StatusClinicWhatsappAccount } from "./StatusClinicWhatsappAccount";

export type ClinicWhatsappAccountProps = {
  id: string;
  clinicaId: string;
  wabaId: string | null;
  phoneNumberId: string | null;
  /** Token em repouso — sempre ciphertext; nunca texto plano no domínio persistido. */
  accessTokenCriptografado: string | null;
  status: StatusClinicWhatsappAccount;
  conectadoEm: Date | null;
  /** Necessário para a rotina de renovação antes da expiração (spec 008). */
  tokenExpiraEm: Date | null;
};

export type ConcluirConexaoProps = {
  wabaId: string;
  phoneNumberId: string;
  accessTokenCriptografado: string;
  tokenExpiraEm: Date;
  conectadoEm?: Date;
};

/**
 * Conta WhatsApp Cloud API da clínica (spec 008 / modelo de domínio).
 * Uma clínica tem no máximo uma conta ativa — invariante reforçada nos casos
 * de uso via repositório (`buscarPorClinicaId` + upsert).
 */
export class ClinicWhatsappAccount {
  readonly id: string;
  readonly clinicaId: string;
  readonly wabaId: string | null;
  readonly phoneNumberId: string | null;
  readonly accessTokenCriptografado: string | null;
  readonly status: StatusClinicWhatsappAccount;
  readonly conectadoEm: Date | null;
  readonly tokenExpiraEm: Date | null;

  private constructor(props: ClinicWhatsappAccountProps) {
    this.id = props.id;
    this.clinicaId = props.clinicaId;
    this.wabaId = props.wabaId;
    this.phoneNumberId = props.phoneNumberId;
    this.accessTokenCriptografado = props.accessTokenCriptografado;
    this.status = props.status;
    this.conectadoEm = props.conectadoEm;
    this.tokenExpiraEm = props.tokenExpiraEm;
  }

  /**
   * Inicia (ou reinicia) o fluxo Embedded Signup — status `pendente`.
   * Não exige waba/phone/token ainda.
   */
  static criarPendente(input: {
    id: string;
    clinicaId: string;
  }): ClinicWhatsappAccount {
    const id = input.id.trim();
    const clinicaId = input.clinicaId.trim();
    if (!id) {
      throw new DadosInvalidosError("Id da conta WhatsApp é obrigatório.");
    }
    if (!clinicaId) {
      throw new DadosInvalidosError("clinicaId da conta WhatsApp é obrigatório.");
    }

    return new ClinicWhatsappAccount({
      id,
      clinicaId,
      wabaId: null,
      phoneNumberId: null,
      accessTokenCriptografado: null,
      status: "pendente",
      conectadoEm: null,
      tokenExpiraEm: null,
    });
  }

  static reconstituir(props: ClinicWhatsappAccountProps): ClinicWhatsappAccount {
    return new ClinicWhatsappAccount(props);
  }

  assertPertenceAClinica(clinicaId: string): void {
    if (this.clinicaId !== clinicaId) {
      throw new TenantMismatchError(clinicaId, this.clinicaId);
    }
  }

  /**
   * Conclui o OAuth: exige token criptografado + ids Meta e marca `conectado`.
   * Só pode ficar `conectado` com token válido (regra do modelo de domínio).
   */
  concluirConexao(input: ConcluirConexaoProps): ClinicWhatsappAccount {
    const wabaId = input.wabaId.trim();
    const phoneNumberId = input.phoneNumberId.trim();
    const accessTokenCriptografado = input.accessTokenCriptografado.trim();

    if (!wabaId) {
      throw new DadosInvalidosError("wabaId é obrigatório para conectar.");
    }
    if (!phoneNumberId) {
      throw new DadosInvalidosError("phoneNumberId é obrigatório para conectar.");
    }
    if (!accessTokenCriptografado) {
      throw new DadosInvalidosError(
        "Token criptografado é obrigatório para status conectado.",
      );
    }
    assertDataValida(input.tokenExpiraEm, "tokenExpiraEm");

    const conectadoEm = input.conectadoEm ?? new Date();
    assertDataValida(conectadoEm, "conectadoEm");

    return new ClinicWhatsappAccount({
      id: this.id,
      clinicaId: this.clinicaId,
      wabaId,
      phoneNumberId,
      accessTokenCriptografado,
      status: "conectado",
      conectadoEm,
      tokenExpiraEm: input.tokenExpiraEm,
    });
  }

  /**
   * Falha no popup/OAuth (ex.: cancelamento) mantém/volta para `pendente`
   * sem derrubar o restante do painel.
   */
  marcarPendente(): ClinicWhatsappAccount {
    return new ClinicWhatsappAccount({
      id: this.id,
      clinicaId: this.clinicaId,
      wabaId: this.wabaId,
      phoneNumberId: this.phoneNumberId,
      accessTokenCriptografado: this.accessTokenCriptografado,
      status: "pendente",
      conectadoEm: this.conectadoEm,
      tokenExpiraEm: this.tokenExpiraEm,
    });
  }

  desconectar(): ClinicWhatsappAccount {
    if (this.status === "desconectado") {
      throw new DadosInvalidosError(
        "Conta WhatsApp já está desconectada; transição inválida.",
      );
    }

    return new ClinicWhatsappAccount({
      id: this.id,
      clinicaId: this.clinicaId,
      wabaId: this.wabaId,
      phoneNumberId: this.phoneNumberId,
      accessTokenCriptografado: null,
      status: "desconectado",
      conectadoEm: this.conectadoEm,
      tokenExpiraEm: null,
    });
  }

  /**
   * Token expirado ou revogado → `desconectado` e bloqueia envio.
   */
  invalidarPorTokenExpiradoOuRevogado(): ClinicWhatsappAccount {
    return new ClinicWhatsappAccount({
      id: this.id,
      clinicaId: this.clinicaId,
      wabaId: this.wabaId,
      phoneNumberId: this.phoneNumberId,
      accessTokenCriptografado: null,
      status: "desconectado",
      conectadoEm: this.conectadoEm,
      tokenExpiraEm: null,
    });
  }

  renovarToken(input: {
    accessTokenCriptografado: string;
    tokenExpiraEm: Date;
  }): ClinicWhatsappAccount {
    if (this.status !== "conectado") {
      throw new TokenWhatsappInvalidoError(this.clinicaId);
    }

    const accessTokenCriptografado = input.accessTokenCriptografado.trim();
    if (!accessTokenCriptografado) {
      throw new DadosInvalidosError(
        "Token criptografado é obrigatório na renovação.",
      );
    }
    assertDataValida(input.tokenExpiraEm, "tokenExpiraEm");

    return new ClinicWhatsappAccount({
      id: this.id,
      clinicaId: this.clinicaId,
      wabaId: this.wabaId,
      phoneNumberId: this.phoneNumberId,
      accessTokenCriptografado,
      status: "conectado",
      conectadoEm: this.conectadoEm,
      tokenExpiraEm: input.tokenExpiraEm,
    });
  }

  /** Envio só é permitido com status `conectado` e token em repouso presente. */
  podeEnviarMensagens(): boolean {
    return (
      this.status === "conectado" &&
      this.accessTokenCriptografado != null &&
      this.accessTokenCriptografado.length > 0
    );
  }

  assertPodeEnviarMensagens(): void {
    if (!this.podeEnviarMensagens()) {
      throw new WhatsappNaoConectadoError(this.clinicaId);
    }
  }

  /**
   * Indica se o token deve ser renovado antes de `agora` (job periódico).
   * Contas sem expiração conhecida ou não conectadas não entram na rotina.
   */
  precisaRenovarToken(agora: Date, antecedenciaMs: number): boolean {
    if (this.status !== "conectado" || this.tokenExpiraEm == null) {
      return false;
    }
    return this.tokenExpiraEm.getTime() - antecedenciaMs <= agora.getTime();
  }
}

function assertDataValida(data: Date, campo: string): void {
  if (!(data instanceof Date) || Number.isNaN(data.getTime())) {
    throw new DadosInvalidosError(`${campo} inválida.`);
  }
}
