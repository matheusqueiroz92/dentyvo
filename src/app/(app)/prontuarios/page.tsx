import { ProntuariosPageClient } from "@/components/prontuario/ProntuariosPageClient";
import { carregarListaPacientes } from "@/lib/pacientes/carregar-pacientes";

export const metadata = {
  title: "Prontuários — Dentyvo",
};

export default async function ProntuariosPage() {
  const pacientes = await carregarListaPacientes();
  return <ProntuariosPageClient iniciais={pacientes} />;
}
