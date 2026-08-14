import { montarMailtoContato, type ContatoPayload } from "./mailto";

/** Abre o cliente de e-mail com a mensagem — usado na landing e em Ajuda. */
export function enviarMensagemContato(payload: ContatoPayload): void {
  window.location.assign(montarMailtoContato(payload));
}
