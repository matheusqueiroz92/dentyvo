import { ConfiguracoesClient } from "@/components/configuracoes/ConfiguracoesClient";
import { carregarContextoApp } from "@/lib/layout/carregar-contexto-app";

export default async function ConfiguracoesPage() {
  const contexto = await carregarContextoApp();
  return <ConfiguracoesClient papel={contexto.usuario.papel} />;
}
