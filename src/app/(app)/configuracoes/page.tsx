import { ConfiguracoesClient } from "@/components/configuracoes/ConfiguracoesClient";
import { carregarContextoApp } from "@/lib/layout/carregar-contexto-app";

type ConfiguracoesPageProps = {
  searchParams: Promise<{ aba?: string }>;
};

export default async function ConfiguracoesPage({
  searchParams,
}: ConfiguracoesPageProps) {
  const contexto = await carregarContextoApp();
  const params = await searchParams;
  return (
    <ConfiguracoesClient
      key={params.aba ?? "padrao"}
      papel={contexto.usuario.papel}
      nomeInicial={contexto.usuario.nome}
      abaInicial={params.aba}
    />
  );
}
