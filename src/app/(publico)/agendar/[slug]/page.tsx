import { AgendarPublicoFlow } from "@/components/agendamento-publico/AgendarPublicoFlow";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function AgendarClinicaPage({ params }: Props) {
  const { slug } = await params;
  return <AgendarPublicoFlow slugClinica={slug} />;
}
