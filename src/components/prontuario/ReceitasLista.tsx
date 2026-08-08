"use client";

import { Download, Pill, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  emitirReceitaAction,
  gerarPdfReceitaAction,
  listarReceitasDoProntuarioAction,
} from "@/actions/receituario";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { baixarPdfBase64 } from "@/lib/receituario/download-pdf";
import type { EmitirReceitaFormValues } from "@/lib/receituario/schema";
import type { ReceitaListaDTO } from "@/lib/receituario/types";

import { EmitirReceitaModal } from "./EmitirReceitaModal";

type ReceitasListaProps = {
  prontuarioId: string;
};

const formatadorData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

type EstadoCarga =
  | { tipo: "carregando" }
  | { tipo: "erro"; mensagem: string }
  | { tipo: "ok"; receitas: ReceitaListaDTO[] };

export function ReceitasLista({ prontuarioId }: ReceitasListaProps) {
  const [estado, setEstado] = useState<EstadoCarga>({ tipo: "carregando" });
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [baixandoId, setBaixandoId] = useState<string | null>(null);

  const carregar = useCallback(async (mostrarLoading: boolean) => {
    if (mostrarLoading) {
      setEstado({ tipo: "carregando" });
    }
    const result = await listarReceitasDoProntuarioAction({ prontuarioId });
    if (result.serverError || !result.data) {
      setEstado({
        tipo: "erro",
        mensagem:
          result.serverError?.mensagem ??
          "Não foi possível carregar as receitas.",
      });
      return;
    }
    setEstado({ tipo: "ok", receitas: result.data });
  }, [prontuarioId]);

  useEffect(() => {
    let cancelado = false;

    void (async () => {
      const result = await listarReceitasDoProntuarioAction({ prontuarioId });
      if (cancelado) return;
      if (result.serverError || !result.data) {
        setEstado({
          tipo: "erro",
          mensagem:
            result.serverError?.mensagem ??
            "Não foi possível carregar as receitas.",
        });
        return;
      }
      setEstado({ tipo: "ok", receitas: result.data });
    })();

    return () => {
      cancelado = true;
    };
  }, [prontuarioId]);

  async function handleEmitir(values: EmitirReceitaFormValues) {
    setSalvando(true);
    try {
      const result = await emitirReceitaAction({
        prontuarioId,
        itens: values.itens,
      });
      if (result.serverError || !result.data) {
        toast.error(
          result.serverError?.mensagem ??
            "Não foi possível emitir a receita.",
        );
        return;
      }
      toast.success("Receita emitida.");
      setModalAberto(false);
      await carregar(false);
    } finally {
      setSalvando(false);
    }
  }

  async function handleBaixarPdf(receitaId: string) {
    setBaixandoId(receitaId);
    try {
      const result = await gerarPdfReceitaAction({ receitaId });
      if (result.serverError || !result.data) {
        toast.error(
          result.serverError?.mensagem ??
            "Não foi possível gerar o PDF da receita.",
        );
        return;
      }
      baixarPdfBase64(
        result.data.pdfBase64,
        result.data.nomeArquivo,
        result.data.contentType,
      );
      toast.success("Download do PDF iniciado.");
    } finally {
      setBaixandoId(null);
    }
  }

  return (
    <section className="space-y-4" aria-labelledby="receituario-titulo">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Pill className="size-4 text-muted-foreground" aria-hidden />
          <h2
            id="receituario-titulo"
            className="text-base font-semibold text-foreground"
          >
            Receituário
          </h2>
        </div>
        <Button
          type="button"
          className="min-h-11"
          onClick={() => setModalAberto(true)}
        >
          Nova receita
        </Button>
      </div>

      {estado.tipo === "carregando" ? (
        <div
          className="space-y-3"
          aria-busy="true"
          aria-label="Carregando receitas"
        >
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : null}

      {estado.tipo === "erro" ? (
        <div className="rounded-lg border border-border bg-card px-4 py-8 text-center">
          <p className="text-sm font-medium text-foreground">
            Não foi possível carregar as receitas
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {estado.mensagem}
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4 min-h-11"
            onClick={() => void carregar(true)}
          >
            <RefreshCw className="size-4" aria-hidden />
            Tentar novamente
          </Button>
        </div>
      ) : null}

      {estado.tipo === "ok" && estado.receitas.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
          <p className="text-sm font-medium text-foreground">
            Nenhuma receita emitida
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Emita uma receita com medicamento, dosagem, posologia e duração
            para o paciente.
          </p>
        </div>
      ) : null}

      {estado.tipo === "ok" && estado.receitas.length > 0 ? (
        <ul className="space-y-3">
          {estado.receitas.map((receita) => (
            <li key={receita.id}>
              <article className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-[13px] tabular-nums text-muted-foreground">
                    {formatadorData.format(new Date(receita.emitidaEmIso))}
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {receita.profissionalNome}
                  </p>
                  <p className="text-[13px] text-muted-foreground">
                    <span className="tabular-nums">
                      {receita.quantidadeItens}
                    </span>{" "}
                    {receita.quantidadeItens === 1 ? "item" : "itens"}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 shrink-0"
                  disabled={baixandoId === receita.id}
                  onClick={() => void handleBaixarPdf(receita.id)}
                >
                  <Download className="size-4" aria-hidden />
                  {baixandoId === receita.id ? "Gerando…" : "Baixar PDF"}
                </Button>
              </article>
            </li>
          ))}
        </ul>
      ) : null}

      <EmitirReceitaModal
        open={modalAberto}
        onOpenChange={setModalAberto}
        salvando={salvando}
        onSalvar={handleEmitir}
      />
    </section>
  );
}
