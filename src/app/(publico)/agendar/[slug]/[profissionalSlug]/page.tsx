import { AgendarPublicoFlow } from "@/components/agendamento-publico/AgendarPublicoFlow";

type Props = {
  params: Promise<{ slug: string; profissionalSlug: string }>;
};

export default async function AgendarProfissionalPage({ params }: Props) {
  const { slug, profissionalSlug } = await params;
  return (
    <AgendarPublicoFlow
      slugClinica={slug}
      slugProfissional={profissionalSlug}
    />
  );
}
