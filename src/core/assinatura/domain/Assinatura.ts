import {
  DadosInvalidosError,
  TenantMismatchError,
} from "@/core/shared/errors";

import type { Cobranca } from "./Cobranca";
import {
  DURACAO_TRIAL_DIAS,
  TOLERANCIA_INADIMPLENCIA_DIAS,
} from "./constants";
import { TransicaoStatusAssinaturaInvalidaError } from "./errors";
import type { ResultadoAcesso } from "./ResultadoAcesso";
import type { StatusAssinatura } from "./StatusAssinatura";

export type AssinaturaProps = {
  id: string;
  clinicaId: string;
  /** Null durante trial até a clínica escolher um plano pago. */
  planoId: string | null;
  status: StatusAssinatura;
  /** Id opaco do cliente no gateway (null no trial puro). */
  gatewayClienteId: string | null;
  /** Id opaco da assinatura recorrente no gateway (null no trial). */
  gatewayAssinaturaId: string | null;
  dataInicio: Date;
  /** Fim do período de trial (preenchido quando status é/foi `trialing`). */
  dataFimTrial: Date | null;
  dataProximaCobranca: Date | null;
  dataCanceladaEm: Date | null;
  /**
   * Override de cortesia/negociação (spec 010, opção A).
   * Não altera o status real de cobrança/`Assinatura`.
   */
  acessoManualAte: Date | null;
  acessoManualMotivo: string | null;
};

const TRANSICOES_ASSINATURA: Record<
  StatusAssinatura,
  readonly StatusAssinatura[]
> = {
  trialing: ["ativa", "cancelada", "inadimplente"],
  ativa: ["inadimplente", "cancelada"],
  inadimplente: ["ativa", "cancelada"],
  cancelada: [],
};

/**
 * Assinatura da clínica na plataforma (spec 010 / modelo de domínio).
 * Regras de trial (14d), tolerância (3d) e acesso manual vivem aqui.
 */
export class Assinatura {
  readonly id: string;
  readonly clinicaId: string;
  readonly planoId: string | null;
  readonly status: StatusAssinatura;
  readonly gatewayClienteId: string | null;
  readonly gatewayAssinaturaId: string | null;
  readonly dataInicio: Date;
  readonly dataFimTrial: Date | null;
  readonly dataProximaCobranca: Date | null;
  readonly dataCanceladaEm: Date | null;
  readonly acessoManualAte: Date | null;
  readonly acessoManualMotivo: string | null;

  private constructor(props: AssinaturaProps) {
    this.id = props.id;
    this.clinicaId = props.clinicaId;
    this.planoId = props.planoId;
    this.status = props.status;
    this.gatewayClienteId = props.gatewayClienteId;
    this.gatewayAssinaturaId = props.gatewayAssinaturaId;
    this.dataInicio = props.dataInicio;
    this.dataFimTrial = props.dataFimTrial;
    this.dataProximaCobranca = props.dataProximaCobranca;
    this.dataCanceladaEm = props.dataCanceladaEm;
    this.acessoManualAte = props.acessoManualAte;
    this.acessoManualMotivo = props.acessoManualMotivo;
  }

  /**
   * Factory do trial: 14 dias corridos a partir de `dataInicio`.
   * Sem gateway e sem plano até `CriarAssinatura`.
   */
  static iniciarTrial(input: {
    id: string;
    clinicaId: string;
    dataInicio?: Date;
  }): Assinatura {
    const id = input.id.trim();
    const clinicaId = input.clinicaId.trim();
    if (!id) throw new DadosInvalidosError("Id da assinatura é obrigatório.");
    if (!clinicaId) {
      throw new DadosInvalidosError("clinicaId da assinatura é obrigatório.");
    }

    const dataInicio = input.dataInicio ?? new Date();
    assertDataValida(dataInicio, "dataInicio");
    const dataFimTrial = adicionarDiasCorridos(dataInicio, DURACAO_TRIAL_DIAS);

    return new Assinatura({
      id,
      clinicaId,
      planoId: null,
      status: "trialing",
      gatewayClienteId: null,
      gatewayAssinaturaId: null,
      dataInicio,
      dataFimTrial,
      dataProximaCobranca: null,
      dataCanceladaEm: null,
      acessoManualAte: null,
      acessoManualMotivo: null,
    });
  }

  static reconstituir(props: AssinaturaProps): Assinatura {
    return new Assinatura(props);
  }

  assertPertenceAClinica(clinicaId: string): void {
    if (this.clinicaId !== clinicaId) {
      throw new TenantMismatchError(clinicaId, this.clinicaId);
    }
  }

  trialExpirado(agora: Date = new Date()): boolean {
    if (this.dataFimTrial == null) return false;
    return agora.getTime() > this.dataFimTrial.getTime();
  }

  temAcessoManualVigente(agora: Date = new Date()): boolean {
    if (this.acessoManualAte == null) return false;
    return this.acessoManualAte.getTime() >= agora.getTime();
  }

  /**
   * Avalia se a clínica pode executar escrita operacional.
   * Override manual tem precedência sem alterar o status de billing.
   */
  avaliarAcesso(agora: Date = new Date()): ResultadoAcesso {
    if (this.temAcessoManualVigente(agora)) {
      return {
        permitido: true,
        motivo: "acesso_manual",
        ateData: this.acessoManualAte!,
      };
    }

    if (this.status === "trialing") {
      if (this.trialExpirado(agora)) {
        return { permitido: false, motivo: "sem_assinatura" };
      }
      return {
        permitido: true,
        motivo: "trialing",
        ateData: this.dataFimTrial ?? undefined,
      };
    }

    if (this.status === "ativa") {
      return { permitido: true, motivo: "ativa" };
    }

    if (this.status === "inadimplente") {
      return { permitido: false, motivo: "inadimplente" };
    }

    return { permitido: false, motivo: "cancelada" };
  }

  /**
   * Converte trial (ou reativa inadimplente) após pagamento confirmado no gateway.
   */
  ativarAposPagamento(input: {
    planoId: string;
    gatewayClienteId: string;
    gatewayAssinaturaId: string;
    dataProximaCobranca: Date | null;
  }): Assinatura {
    this.assertPodeTransicionarPara("ativa");
    const planoId = input.planoId.trim();
    const gatewayClienteId = input.gatewayClienteId.trim();
    const gatewayAssinaturaId = input.gatewayAssinaturaId.trim();
    if (!planoId) throw new DadosInvalidosError("planoId é obrigatório.");
    if (!gatewayClienteId) {
      throw new DadosInvalidosError("gatewayClienteId é obrigatório.");
    }
    if (!gatewayAssinaturaId) {
      throw new DadosInvalidosError("gatewayAssinaturaId é obrigatório.");
    }
    if (input.dataProximaCobranca != null) {
      assertDataValida(input.dataProximaCobranca, "dataProximaCobranca");
    }

    return this.clonar({
      status: "ativa",
      planoId,
      gatewayClienteId,
      gatewayAssinaturaId,
      dataProximaCobranca: input.dataProximaCobranca,
      dataCanceladaEm: null,
    });
  }

  /**
   * Vincula plano/gateway ao criar assinatura paga ainda sem o 1º pagamento
   * confirmado — mantém `trialing` se o trial ainda vigorar; caso contrário
   * o caso de uso decide ativar só após webhook de pagamento.
   */
  vincularPlanoNoGateway(input: {
    planoId: string;
    gatewayClienteId: string;
    gatewayAssinaturaId: string;
    dataProximaCobranca: Date | null;
  }): Assinatura {
    const planoId = input.planoId.trim();
    const gatewayClienteId = input.gatewayClienteId.trim();
    const gatewayAssinaturaId = input.gatewayAssinaturaId.trim();
    if (!planoId) throw new DadosInvalidosError("planoId é obrigatório.");
    if (!gatewayClienteId) {
      throw new DadosInvalidosError("gatewayClienteId é obrigatório.");
    }
    if (!gatewayAssinaturaId) {
      throw new DadosInvalidosError("gatewayAssinaturaId é obrigatório.");
    }
    if (input.dataProximaCobranca != null) {
      assertDataValida(input.dataProximaCobranca, "dataProximaCobranca");
    }

    return this.clonar({
      planoId,
      gatewayClienteId,
      gatewayAssinaturaId,
      dataProximaCobranca: input.dataProximaCobranca,
    });
  }

  /**
   * Após tolerância de 3 dias corridos com cobrança `vencida`.
   */
  marcarInadimplente(): Assinatura {
    this.assertPodeTransicionarPara("inadimplente");
    return this.clonar({ status: "inadimplente" });
  }

  /**
   * Restaura acesso após pagamento de cobrança em atraso (webhook).
   * Não mexe em `acessoManualAte`.
   */
  restaurarAposPagamento(
    dataProximaCobranca: Date | null = this.dataProximaCobranca,
  ): Assinatura {
    if (this.status === "ativa") {
      return this.clonar({ dataProximaCobranca });
    }
    this.assertPodeTransicionarPara("ativa");
    if (dataProximaCobranca != null) {
      assertDataValida(dataProximaCobranca, "dataProximaCobranca");
    }
    return this.clonar({
      status: "ativa",
      dataProximaCobranca,
      dataCanceladaEm: null,
    });
  }

  cancelar(dataCanceladaEm: Date = new Date()): Assinatura {
    this.assertPodeTransicionarPara("cancelada");
    assertDataValida(dataCanceladaEm, "dataCanceladaEm");
    return this.clonar({
      status: "cancelada",
      dataCanceladaEm,
    });
  }

  /**
   * Override de acesso (super-admin). Não altera status de cobrança/assinatura.
   */
  concederAcessoManual(input: {
    motivo: string;
    ateData: Date;
  }): Assinatura {
    const motivo = input.motivo.trim();
    if (!motivo) {
      throw new DadosInvalidosError("Motivo da concessão manual é obrigatório.");
    }
    assertDataValida(input.ateData, "ateData");
    return this.clonar({
      acessoManualAte: input.ateData,
      acessoManualMotivo: motivo,
    });
  }

  /**
   * Cobrança vencida há mais de `TOLERANCIA_INADIMPLENCIA_DIAS` dias corridos
   * (contado a partir de `vencidaEm`).
   */
  deveMarcarInadimplentePorCobranca(
    cobranca: Cobranca,
    agora: Date = new Date(),
  ): boolean {
    if (cobranca.status !== "vencida" || cobranca.vencidaEm == null) {
      return false;
    }
    if (this.status !== "ativa" && this.status !== "trialing") {
      return false;
    }
    const limite = adicionarDiasCorridos(
      cobranca.vencidaEm,
      TOLERANCIA_INADIMPLENCIA_DIAS,
    );
    return agora.getTime() > limite.getTime();
  }

  private assertPodeTransicionarPara(destino: StatusAssinatura): void {
    if (!TRANSICOES_ASSINATURA[this.status].includes(destino)) {
      throw new TransicaoStatusAssinaturaInvalidaError(this.status, destino);
    }
  }

  private clonar(patch: Partial<AssinaturaProps>): Assinatura {
    return new Assinatura({
      id: this.id,
      clinicaId: this.clinicaId,
      planoId: this.planoId,
      status: this.status,
      gatewayClienteId: this.gatewayClienteId,
      gatewayAssinaturaId: this.gatewayAssinaturaId,
      dataInicio: this.dataInicio,
      dataFimTrial: this.dataFimTrial,
      dataProximaCobranca: this.dataProximaCobranca,
      dataCanceladaEm: this.dataCanceladaEm,
      acessoManualAte: this.acessoManualAte,
      acessoManualMotivo: this.acessoManualMotivo,
      ...patch,
    });
  }
}

function assertDataValida(data: Date, campo: string): void {
  if (!(data instanceof Date) || Number.isNaN(data.getTime())) {
    throw new DadosInvalidosError(`${campo} inválida.`);
  }
}

/** Soma dias corridos preservando horário local do instante base. */
export function adicionarDiasCorridos(base: Date, dias: number): Date {
  const resultado = new Date(base.getTime());
  resultado.setDate(resultado.getDate() + dias);
  return resultado;
}
