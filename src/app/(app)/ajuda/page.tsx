import { AjudaPageClient } from "@/components/ajuda/AjudaPageClient";
import { carregarContextoApp } from "@/lib/layout/carregar-contexto-app";

export const metadata = {
  title: "Ajuda e suporte — Dentyvo",
};

export default async function AjudaPage() {
  const contexto = await carregarContextoApp();
  return <AjudaPageClient usuarioNome={contexto.usuario.nome} />;
}
