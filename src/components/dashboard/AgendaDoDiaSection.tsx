import { carregarAgendamentosHoje } from "@/lib/dashboard/carregar-agendamentos-hoje";

import { AgendaDoDiaCard } from "./AgendaDoDiaCard";

export async function AgendaDoDiaSection() {
  const resultado = await carregarAgendamentosHoje();
  return <AgendaDoDiaCard resultado={resultado} />;
}
