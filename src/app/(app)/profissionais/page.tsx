import { ProfissionaisPageClient } from "@/components/profissionais/ProfissionaisPageClient";
import { carregarEquipeInicial } from "@/lib/profissionais/carregar-equipe";

export const metadata = {
  title: "Profissionais — Dentyvo",
};

export default async function ProfissionaisPage() {
  const iniciais = await carregarEquipeInicial();
  return <ProfissionaisPageClient iniciais={iniciais} />;
}
