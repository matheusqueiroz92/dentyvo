import { temaClinicaOuPadrao } from "@/lib/tema-clinica";
import { cn } from "@/lib/utils";

type Props = {
  clinicaNome: string;
  logoUrl: string | null;
  tema: string | null;
  children: React.ReactNode;
  className?: string;
};

/** Casca visual do fluxo público — tema/logo da clínica ou wordmark Dentyvo. */
export function PublicoClinicaShell({
  clinicaNome,
  logoUrl,
  tema,
  children,
  className,
}: Props) {
  const temaEfetivo = temaClinicaOuPadrao(tema);

  return (
    <div
      data-tema-clinica={temaEfetivo}
      className={cn(
        "flex min-h-full flex-1 flex-col bg-background text-foreground",
        className,
      )}
    >
      <header className="border-b border-border/80 bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-lg items-center gap-3 px-4 py-3">
          <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- URL externa (Blob)
              <img src={logoUrl} alt="" className="size-full object-cover" />
            ) : (
              <span className="text-[11px] font-semibold tracking-tight text-primary">
                Dv
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-5">
              {clinicaNome || "Dentyvo"}
            </p>
            <p className="text-xs text-muted-foreground">Agendamento online</p>
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-lg flex-1 px-4 py-6">{children}</div>
      <footer className="border-t border-border/60 py-4 text-center text-[11px] text-muted-foreground">
        {logoUrl || clinicaNome ? (
          <span>
            Powered by{" "}
            <span className="font-medium text-foreground">Dentyvo</span>
          </span>
        ) : (
          <span className="font-medium text-foreground">Dentyvo</span>
        )}
      </footer>
    </div>
  );
}

/** Shell mínimo quando ainda não há clínica (erro/loading). */
export function PublicoFallbackShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PublicoClinicaShell clinicaNome="Dentyvo" logoUrl={null} tema={null}>
      {children}
    </PublicoClinicaShell>
  );
}
