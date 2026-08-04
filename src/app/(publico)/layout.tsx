import { temaClinicaOuPadrao } from "@/lib/tema-clinica";

type Props = {
  children: React.ReactNode;
};

/**
 * Layout do canal público (sem AppShell).
 * Tema/logo da clínica são aplicados no fluxo após resolver o contexto.
 */
export default function PublicoLayout({ children }: Props) {
  return (
    <div
      data-tema-clinica={temaClinicaOuPadrao(null)}
      className="flex min-h-full flex-1 flex-col bg-background text-foreground"
    >
      {children}
    </div>
  );
}
