import { carregarAgendamentosHoje } from "@/lib/dashboard/carregar-agendamentos-hoje";

import { ConfirmacoesPendentesCard } from "./ConfirmacoesPendentesCard";

export async function ConfirmacoesPendentesSection() {
  const resultado = await carregarAgendamentosHoje();
  return <ConfirmacoesPendentesCard resultado={resultado} />;
}
