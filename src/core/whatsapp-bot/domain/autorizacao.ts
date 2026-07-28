import type { Papel } from "@/core/auth/domain/Papel";
import { criarVerificadorAutorizacao } from "@/core/shared/autorizacao";

/**
 * Ações da matriz de permissões do módulo WhatsApp (spec 008).
 *
 * Nota: a spec 008 não traz tabela RBAC explícita. A user story fala em
 * "dono de clínica" e o paralelo em auth é `editar_clinica` (só admin).
 * `renovar_token_whatsapp` é job de sistema — fora da matriz de papéis de
 * clínica (sem checagem de `Profissional`).
 */
export const ACOES_WHATSAPP = [
  "iniciar_conexao_whatsapp",
  "concluir_conexao_whatsapp",
  "desconectar_whatsapp",
] as const;

export type AcaoWhatsapp = (typeof ACOES_WHATSAPP)[number];

const MATRIZ: Record<AcaoWhatsapp, readonly Papel[]> = {
  iniciar_conexao_whatsapp: ["admin"],
  concluir_conexao_whatsapp: ["admin"],
  desconectar_whatsapp: ["admin"],
};

export const { pode, assertPode } = criarVerificadorAutorizacao(MATRIZ);
