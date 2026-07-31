import { carregarStatusAssinatura } from "@/lib/dashboard/carregar-status-assinatura";

import { StatusAssinaturaCard } from "./StatusAssinaturaCard";

export async function StatusAssinaturaSection() {
  const resultado = await carregarStatusAssinatura();
  return <StatusAssinaturaCard resultado={resultado} />;
}
