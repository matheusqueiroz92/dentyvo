import { DadosInvalidosError } from "@/core/shared/errors";

/**
 * Conteúdo operacional da notificação — **sem PHI / dado clínico**.
 * Mesmo espírito de `DetalheAuditoria` (spec 003): allowlist de metadados/IDs
 * e textos operacionais (título, mensagem, link), nunca campos clínicos
 * (descrição de evolução, respostas de anamnese, nome/CPF de paciente, etc.).
 *
 * Spec 011: ids de assinatura/cobrança, nome do plano, datas, link de ação.
 */
export type ConteudoNotificacao = {
  /** Rótulo curto operacional (ex.: "Trial acabando"). */
  titulo?: string;
  /** Corpo operacional — não usar para texto clínico. */
  mensagem?: string;
  linkAcao?: string;
  planoId?: string;
  planoNome?: string;
  assinaturaId?: string;
  cobrancaId?: string;
  conviteId?: string;
  agendamentoId?: string;
  /** Data de referência operacional em ISO-8601 (fim do trial, vencimento). */
  dataReferenciaIso?: string;
  /** Valor em centavos quando a notificação cita cobrança (sem dado clínico). */
  valorCentavos?: number;
};

/**
 * Remove chaves não permitidas e valida tipos.
 * Payload adulterado com campos clínicos é descartado (não persistido).
 */
export function sanitizarConteudoNotificacao(
  conteudo: ConteudoNotificacao,
): ConteudoNotificacao {
  const limpo: ConteudoNotificacao = {};

  if (conteudo.titulo !== undefined) {
    limpo.titulo = assertTexto(conteudo.titulo, "conteudo.titulo");
  }
  if (conteudo.mensagem !== undefined) {
    limpo.mensagem = assertTexto(conteudo.mensagem, "conteudo.mensagem");
  }
  if (conteudo.linkAcao !== undefined) {
    limpo.linkAcao = assertTexto(conteudo.linkAcao, "conteudo.linkAcao");
  }
  if (conteudo.planoId !== undefined) {
    limpo.planoId = assertTexto(conteudo.planoId, "conteudo.planoId");
  }
  if (conteudo.planoNome !== undefined) {
    limpo.planoNome = assertTexto(conteudo.planoNome, "conteudo.planoNome");
  }
  if (conteudo.assinaturaId !== undefined) {
    limpo.assinaturaId = assertTexto(
      conteudo.assinaturaId,
      "conteudo.assinaturaId",
    );
  }
  if (conteudo.cobrancaId !== undefined) {
    limpo.cobrancaId = assertTexto(conteudo.cobrancaId, "conteudo.cobrancaId");
  }
  if (conteudo.conviteId !== undefined) {
    limpo.conviteId = assertTexto(conteudo.conviteId, "conteudo.conviteId");
  }
  if (conteudo.agendamentoId !== undefined) {
    limpo.agendamentoId = assertTexto(
      conteudo.agendamentoId,
      "conteudo.agendamentoId",
    );
  }
  if (conteudo.dataReferenciaIso !== undefined) {
    limpo.dataReferenciaIso = assertTexto(
      conteudo.dataReferenciaIso,
      "conteudo.dataReferenciaIso",
    );
  }
  if (conteudo.valorCentavos !== undefined) {
    if (
      typeof conteudo.valorCentavos !== "number" ||
      !Number.isInteger(conteudo.valorCentavos) ||
      conteudo.valorCentavos < 0
    ) {
      throw new DadosInvalidosError("conteudo.valorCentavos inválido.");
    }
    limpo.valorCentavos = conteudo.valorCentavos;
  }

  return limpo;
}

function assertTexto(valor: string, campo: string): string {
  if (typeof valor !== "string") {
    throw new DadosInvalidosError(`${campo} deve ser texto.`);
  }
  const trimmed = valor.trim();
  if (!trimmed) {
    throw new DadosInvalidosError(`${campo} não pode ser vazio.`);
  }
  return trimmed;
}
