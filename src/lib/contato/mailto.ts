import { CONTATO_EMAIL } from "./canais";
import type { TipoContato } from "./schema";

export type ContatoPayload = {
  nome: string;
  email?: string;
  assunto?: string;
  mensagem: string;
  tipo?: TipoContato;
};

const ROTULO_TIPO: Record<TipoContato, string> = {
  bug: "Bug",
  duvida: "Dúvida",
};

/**
 * Monta o `mailto` do canal comercial — mesmo mecanismo da landing e do
 * suporte autenticado até existir backend de formulário de contato.
 */
export function montarMailtoContato(payload: ContatoPayload): string {
  const prefixo = payload.tipo ? `[${ROTULO_TIPO[payload.tipo]}] ` : "";
  const assunto = `${prefixo}${payload.assunto?.trim() || "Contato Dentyvo"}`;
  const corpo = [
    `Nome: ${payload.nome}`,
    payload.email ? `E-mail: ${payload.email}` : null,
    payload.tipo ? `Tipo: ${ROTULO_TIPO[payload.tipo]}` : null,
    "",
    payload.mensagem,
  ]
    .filter((linha) => linha !== null)
    .join("\n");

  return `mailto:${CONTATO_EMAIL}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
}
