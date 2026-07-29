/**
 * Retorno de `VerificarAcessoAtivo` (spec 010).
 * `permitido` governa escrita operacional; leituras não consultam este resultado
 * na etapa de integração pós-010 (call-site explícito).
 */
export type MotivoAcesso =
  | "trialing"
  | "ativa"
  | "acesso_manual"
  | "inadimplente"
  | "cancelada"
  | "sem_assinatura";

export type ResultadoAcesso = {
  permitido: boolean;
  motivo: MotivoAcesso;
  /** Fim do trial ou do override manual, quando aplicável. */
  ateData?: Date;
};
