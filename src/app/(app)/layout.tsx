import { AppShell } from "@/components/layout";
import { carregarContextoApp } from "@/lib/layout/carregar-contexto-app";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const contexto = await carregarContextoApp();

  return <AppShell contexto={contexto}>{children}</AppShell>;
}
