"use client";

import { History } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  SECAO_ANAMNESE_LABELS,
  SECOES_ANAMNESE_FORM,
} from "@/lib/prontuario/schema";
import type { AnamneseDTO } from "@/lib/prontuario/types";
import { cn } from "@/lib/utils";

type AnamneseHistoricoProps = {
  versoes: AnamneseDTO[];
  versaoSelecionadaId: string | null;
  onSelecionar: (versao: AnamneseDTO) => void;
};

const formatadorData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export function AnamneseHistorico({
  versoes,
  versaoSelecionadaId,
  onSelecionar,
}: AnamneseHistoricoProps) {
  if (versoes.length === 0) {
    return null;
  }

  const selecionada =
    versoes.find((v) => v.id === versaoSelecionadaId) ?? versoes[0];
  const ehVigente = selecionada.id === versoes[0]?.id;

  return (
    <section className="space-y-4" aria-labelledby="anamnese-historico-titulo">
      <div className="flex items-center gap-2">
        <History className="size-4 text-muted-foreground" aria-hidden />
        <h3
          id="anamnese-historico-titulo"
          className="text-sm font-semibold text-foreground"
        >
          Histórico de versões
        </h3>
      </div>

      <ul className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {versoes.map((versao) => {
          const ativa = versao.id === selecionada.id;
          const vigente = versao.id === versoes[0]?.id;
          return (
            <li key={versao.id}>
              <Button
                type="button"
                variant={ativa ? "default" : "outline"}
                className="min-h-11 justify-start tabular-nums"
                onClick={() => onSelecionar(versao)}
                aria-pressed={ativa}
              >
                <span>
                  v{versao.versao}
                  {vigente ? " (vigente)" : ""}
                </span>
                <span className="ml-2 text-[12px] font-normal opacity-80">
                  {formatadorData.format(new Date(versao.preenchidoEmIso))}
                </span>
              </Button>
            </li>
          );
        })}
      </ul>

      <div
        className={cn(
          "rounded-lg border border-border bg-card p-4",
          !ehVigente && "border-dashed",
        )}
      >
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <p className="text-sm font-medium text-foreground">
            Versão {selecionada.versao}
            {!ehVigente ? (
              <span className="ml-2 text-[13px] font-normal text-muted-foreground">
                (somente leitura)
              </span>
            ) : null}
          </p>
          <p className="text-[13px] text-muted-foreground">
            Preenchida por {selecionada.preenchidoPorNome} em{" "}
            <span className="tabular-nums">
              {formatadorData.format(new Date(selecionada.preenchidoEmIso))}
            </span>
          </p>
        </div>

        <AnamneseRespostasExibicao respostas={selecionada.respostas} />
      </div>
    </section>
  );
}

export function AnamneseRespostasExibicao({
  respostas,
}: {
  respostas: AnamneseDTO["respostas"];
}) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {SECOES_ANAMNESE_FORM.map((chave) => {
        const secao = respostas[chave];
        return (
          <div key={chave} className="space-y-1">
            <dt className="text-xs text-muted-foreground">
              {SECAO_ANAMNESE_LABELS[chave]}
            </dt>
            <dd className="text-sm text-foreground">
              {secao.negado ? (
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="inline-block size-1.5 rounded-full bg-muted-foreground"
                    aria-hidden
                  />
                  Nada a declarar / nega
                </span>
              ) : (
                (secao.texto ?? "—")
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
