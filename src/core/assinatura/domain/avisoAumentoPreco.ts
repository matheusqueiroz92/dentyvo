import {
  ANTECEDENCIA_AVISO_AUMENTO_PRECO_DIAS,
} from "./constants";
import { adicionarDiasCorridos, type Assinatura } from "./Assinatura";

/**
 * `chaveNegocio` estável para a 2ª camada de dedup (spec 012, D7).
 * Formato: `aviso_aumento_preco:{assinaturaId}:{precoPromocionalAte:yyyy-MM-dd}`
 */
export function chaveNegocioAvisoAumentoPreco(
  assinaturaId: string,
  precoPromocionalAte: Date,
): string {
  const dia = precoPromocionalAte.toISOString().slice(0, 10);
  return `aviso_aumento_preco:${assinaturaId}:${dia}`;
}

/**
 * Janela em que o job deve disparar o aviso: a partir de
 * (`precoPromocionalAte` − 30 dias) até o fim da promoção (D4).
 */
export function inicioJanelaAvisoAumentoPreco(
  precoPromocionalAte: Date,
): Date {
  return adicionarDiasCorridos(
    precoPromocionalAte,
    -ANTECEDENCIA_AVISO_AUMENTO_PRECO_DIAS,
  );
}

/**
 * Camada 1 (D7): se já enviou, o caso de uso **não** chama `EnviarNotificacao`.
 */
export function jaEnviouAvisoAumentoPreco(assinatura: Assinatura): boolean {
  return assinatura.avisoAumentoPrecoEnviadoEm != null;
}

/**
 * Candidata ao job: tem cópia promocional, ainda não enviou aviso,
 * e `agora` está na janela de 30 dias antes do fim.
 */
export function assinaturaPendenteDeAvisoAumentoPreco(
  assinatura: Assinatura,
  agora: Date = new Date(),
): boolean {
  if (assinatura.precoPromocionalAte == null) return false;
  if (jaEnviouAvisoAumentoPreco(assinatura)) return false;
  if (!assinatura.temCopiaPromocional()) return false;

  const inicio = inicioJanelaAvisoAumentoPreco(assinatura.precoPromocionalAte);
  return (
    agora.getTime() >= inicio.getTime() &&
    agora.getTime() < assinatura.precoPromocionalAte.getTime()
  );
}
