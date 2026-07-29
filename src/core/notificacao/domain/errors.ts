export {
  DadosInvalidosError,
  PermissaoNegadaError,
  TenantMismatchError,
} from "@/core/shared/errors";

export class NotificacaoNaoEncontradaError extends Error {
  readonly nome = "NotificacaoNaoEncontradaError" as const;

  constructor(readonly notificacaoId: string) {
    super("Notificação não encontrada.");
    this.name = this.nome;
  }
}

export class NotificacaoNaoPertenceAoDestinatarioError extends Error {
  readonly nome = "NotificacaoNaoPertenceAoDestinatarioError" as const;

  constructor(readonly notificacaoId: string) {
    super("Notificação não pertence ao destinatário da sessão.");
    this.name = this.nome;
  }
}

export class TransicaoStatusEnvioInvalidaError extends Error {
  readonly nome = "TransicaoStatusEnvioInvalidaError" as const;

  constructor(
    readonly canal: string,
    readonly de: string,
    readonly para: string,
  ) {
    super(
      `Transição de statusEnvio inválida no canal "${canal}": ${de} → ${para}.`,
    );
    this.name = this.nome;
  }
}

export class CanalAusenteError extends Error {
  readonly nome = "CanalAusenteError" as const;

  constructor(readonly canal: string) {
    super(`Canal "${canal}" não faz parte desta notificação.`);
    this.name = this.nome;
  }
}
