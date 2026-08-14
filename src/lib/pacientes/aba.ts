export const ABAS_DETALHE_PACIENTE = [
  "dados",
  "historico",
  "prontuario",
] as const;

export type AbaDetalhePaciente = (typeof ABAS_DETALHE_PACIENTE)[number];

export function abaDetalhePacienteDaQuery(
  valor: string | null,
): AbaDetalhePaciente {
  if (valor === "historico" || valor === "prontuario") return valor;
  return "dados";
}
