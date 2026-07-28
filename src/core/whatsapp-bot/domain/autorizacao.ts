import type { Papel } from "@/core/auth/domain/Papel";
import { criarVerificadorAutorizacao } from "@/core/shared/autorizacao";

/**
 * Ações da matriz de permissões do módulo WhatsApp (spec 008, aprovada).
 * Só `admin` inicia/conclui/desconecta. `RenovarTokenWhatsapp` é job de
 * sistema — fora desta matriz (sem checagem de `Profissional`).
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
