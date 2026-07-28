import type { Papel } from "@/core/auth/domain/Papel";
import { criarVerificadorAutorizacao } from "@/core/shared/autorizacao";

/** Ações da matriz de permissões do módulo paciente (spec 002). */
export const ACOES_PACIENTE = [
  "criar_paciente",
  "buscar_paciente",
  "listar_pacientes",
] as const;

export type AcaoPaciente = (typeof ACOES_PACIENTE)[number];

const MATRIZ: Record<AcaoPaciente, readonly Papel[]> = {
  criar_paciente: ["admin", "dentista", "recepcao"],
  buscar_paciente: ["admin", "dentista", "recepcao"],
  listar_pacientes: ["admin", "dentista", "recepcao"],
};

export const { pode, assertPode } = criarVerificadorAutorizacao(MATRIZ);
