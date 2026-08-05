"use client";

import { FilePlus2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type CriarProntuarioCardProps = {
  criando: boolean;
  onCriar: () => void;
};

export function CriarProntuarioCard({
  criando,
  onCriar,
}: CriarProntuarioCardProps) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card px-4 py-10 text-center">
      <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <FilePlus2 className="size-5" aria-hidden />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-foreground">
        Prontuário ainda não criado
      </h3>
      <p className="mx-auto mt-1 max-w-md text-[13px] leading-5 text-muted-foreground">
        Este paciente ainda não possui prontuário eletrônico. Crie o prontuário
        para registrar a anamnese e o histórico clínico.
      </p>
      <Button
        type="button"
        className="mt-6 min-h-11"
        disabled={criando}
        onClick={onCriar}
      >
        {criando ? "Criando…" : "Criar prontuário"}
      </Button>
    </div>
  );
}
