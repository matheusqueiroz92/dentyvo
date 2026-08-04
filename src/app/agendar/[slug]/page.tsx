import { AgendarPublicoClient } from "./agendar-publico-client";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function AgendarClinicaPage({ params }: Props) {
  const { slug } = await params;
  return <AgendarPublicoClient slugClinica={slug} />;
}
