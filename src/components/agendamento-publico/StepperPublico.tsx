import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export type EtapaPublicaId =
  | "profissional"
  | "procedimento"
  | "horario"
  | "dados"
  | "confirmacao";

const ROTULOS: Record<EtapaPublicaId, string> = {
  profissional: "Profissional",
  procedimento: "Procedimento",
  horario: "Horário",
  dados: "Seus dados",
  confirmacao: "Confirmar",
};

type Props = {
  etapas: EtapaPublicaId[];
  atual: EtapaPublicaId;
};

export function StepperPublico({ etapas, atual }: Props) {
  const indiceAtual = etapas.indexOf(atual);

  return (
    <nav aria-label="Etapas do agendamento" className="mb-6">
      <ol className="flex items-center gap-1">
        {etapas.map((id, i) => {
          const concluida = i < indiceAtual;
          const ativa = i === indiceAtual;
          return (
            <li key={id} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <div className="flex w-full items-center gap-1">
                {i > 0 ? (
                  <span
                    className={cn(
                      "h-0.5 flex-1 rounded-full",
                      concluida || ativa ? "bg-primary" : "bg-border",
                    )}
                    aria-hidden
                  />
                ) : null}
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums",
                    concluida && "bg-primary text-primary-foreground",
                    ativa && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                    !concluida && !ativa && "bg-muted text-muted-foreground",
                  )}
                  aria-current={ativa ? "step" : undefined}
                >
                  {concluida ? <Check className="size-3.5" aria-hidden /> : i + 1}
                </span>
                {i < etapas.length - 1 ? (
                  <span
                    className={cn(
                      "h-0.5 flex-1 rounded-full",
                      concluida ? "bg-primary" : "bg-border",
                    )}
                    aria-hidden
                  />
                ) : null}
              </div>
              <span
                className={cn(
                  "max-w-full truncate text-center text-[10px] leading-tight",
                  ativa ? "font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                {ROTULOS[id]}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
