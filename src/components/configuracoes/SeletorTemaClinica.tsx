"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { atualizarTemaClinicaAction } from "@/actions/configuracoes-clinica";
import { TemaClinicaPicker } from "@/components/auth/TemaClinicaPicker";
import { useTemaClinica } from "@/components/layout/tema-clinica-context";
import type { TemaClinica } from "@/core/auth/domain/TemaClinica";
import { temaClinicaOuPadrao } from "@/lib/tema-clinica";

type SeletorTemaClinicaProps = {
  temaInicial: TemaClinica | null;
};

/**
 * Seleção de tema na aba Geral. Reusa o preview visual do cadastro
 * (`TemaClinicaPicker`) e persiste via `AtualizarTemaClinica`.
 */
export function SeletorTemaClinica({ temaInicial }: SeletorTemaClinicaProps) {
  const { aplicarTema } = useTemaClinica();
  const [tema, setTema] = useState<TemaClinica>(() =>
    temaClinicaOuPadrao(temaInicial),
  );
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function selecionar(proximo: TemaClinica) {
    if (proximo === tema || pending) return;

    const anterior = tema;
    setErro(null);
    setTema(proximo);
    aplicarTema(proximo);

    startTransition(async () => {
      const result = await atualizarTemaClinicaAction({ tema: proximo });
      if (result.serverError || !result.data) {
        setTema(anterior);
        aplicarTema(anterior);
        const mensagem =
          result.serverError?.mensagem ??
          "Não foi possível atualizar o tema.";
        setErro(mensagem);
        toast.error(mensagem);
        return;
      }

      setTema(result.data.tema);
      aplicarTema(result.data.tema);
    });
  }

  return (
    <section className="space-y-3" aria-labelledby="tema-visual-titulo">
      <div>
        <h2 id="tema-visual-titulo" className="text-base font-semibold">
          Tema visual
        </h2>
        <p className="text-sm text-muted-foreground">
          A paleta se aplica imediatamente em toda a clínica. Clique em outro
          tema para reverter.
        </p>
      </div>
      <TemaClinicaPicker value={tema} onChange={selecionar} />
      {erro ? (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      ) : null}
    </section>
  );
}
