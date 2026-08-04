import { AgendarPublicoClient } from "../agendar-publico-client";

type Props = {
  params: Promise<{ slug: string; profissionalSlug: string }>;
};

export default async function AgendarProfissionalPage({ params }: Props) {
  const { slug, profissionalSlug } = await params;
  return (
    <AgendarPublicoClient
      slugClinica={slug}
      slugProfissional={profissionalSlug}
    />
  );
}
