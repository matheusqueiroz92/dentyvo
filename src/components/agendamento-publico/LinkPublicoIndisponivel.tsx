import { Link2Off } from "lucide-react";

import { PublicoFallbackShell } from "./PublicoClinicaShell";

type Props = {
  mensagem?: string;
};

export function LinkPublicoIndisponivel({ mensagem }: Props) {
  return (
    <PublicoFallbackShell>
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
          <Link2Off className="size-6 text-muted-foreground" aria-hidden />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight">
            Este link não está mais disponível
          </h1>
          <p className="text-sm text-muted-foreground">
            {mensagem ??
              "A clínica pode ter alterado o endereço do agendamento online ou desativado o acesso. Peça o link atualizado à clínica."}
          </p>
        </div>
      </div>
    </PublicoFallbackShell>
  );
}
