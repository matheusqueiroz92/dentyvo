"use client";

import { Download, FileCheck, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  emitirAtestadoAction,
  gerarPdfAtestadoAction,
  listarAtestadosDoProntuarioAction,
} from "@/actions/atestado";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { EmitirAtestadoFormValues } from "@/lib/atestado/schema";
import type { AtestadoListaDTO } from "@/lib/atestado/types";
import { baixarPdfBase64 } from "@/lib/receituario/download-pdf";

import { EmitirAtestadoModal } from "./EmitirAtestadoModal";

type AtestadosListaProps = {
  prontuarioId: string;
};

const formatadorData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

type EstadoCarga =
  | { tipo: "carregando" }
  | { tipo: "erro"; mensagem: string }
  | { tipo: "ok"; atestados: AtestadoListaDTO[] };

export function AtestadosLista({ prontuarioId }: AtestadosListaProps) {
  const [estado, setEstado] = useState<EstadoCarga>({ tipo: "carregando" });
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [baixandoId, setBaixandoId] = useState<string | null>(null);

  const carregar = useCallback(
    async (mostrarLoading: boolean) => {
      if (mostrarLoading) {
        setEstado({ tipo: "carregando" });
      }
      const result = await listarAtestadosDoProntuarioAction({ prontuarioId });
      if (result.serverError || !result.data) {
        setEstado({
          tipo: "erro",
          mensagem:
            result.serverError?.mensagem ??
            "Não foi possível carregar os atestados.",
        });
        return;
      }
      setEstado({ tipo: "ok", atestados: result.data });
    },
    [prontuarioId],
  );

  useEffect(() => {
    let cancelado = false;

    void (async () => {
      const result = await listarAtestadosDoProntuarioAction({ prontuarioId });
      if (cancelado) return;
      if (result.serverError || !result.data) {
        setEstado({
          tipo: "erro",
          mensagem:
            result.serverError?.mensagem ??
            "Não foi possível carregar os atestados.",
        });
        return;
      }
      setEstado({ tipo: "ok", atestados: result.data });
    })();

    return () => {
      cancelado = true;
    };
  }, [prontuarioId]);

  async function handleEmitir(values: EmitirAtestadoFormValues) {
    setSalvando(true);
    try {
      const result = await emitirAtestadoAction({
        prontuarioId,
        motivo: values.motivo,
        cid: values.cid,
        dataInicio: values.dataInicio,
        quantidadeDias: values.quantidadeDias,
      });
      if (result.serverError || !result.data) {
        toast.error(
          result.serverError?.mensagem ??
            "Não foi possível emitir o atestado.",
        );
        return;
      }
      toast.success("Atestado emitido.");
      setModalAberto(false);
      await carregar(false);
    } finally {
      setSalvando(false);
    }
  }

  async function handleBaixarPdf(atestadoId: string) {
    setBaixandoId(atestadoId);
    try {
      const result = await gerarPdfAtestadoAction({ atestadoId });
      if (result.serverError || !result.data) {
        toast.error(
          result.serverError?.mensagem ??
            "Não foi possível gerar o PDF do atestado.",
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
    <section className="space-y-4" aria-labelledby="atestado-titulo">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <FileCheck className="size-4 text-muted-foreground" aria-hidden />
          <h2
            id="atestado-titulo"
            className="text-base font-semibold text-foreground"
          >
            Atestados
          </h2>
        </div>
        <Button
          type="button"
          className="min-h-11"
          onClick={() => setModalAberto(true)}
        >
          Novo atestado
        </Button>
      </div>

      {estado.tipo === "carregando" ? (
        <div
          className="space-y-3"
          aria-busy="true"
          aria-label="Carregando atestados"
        >
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : null}

      {estado.tipo === "erro" ? (
        <div className="rounded-lg border border-border bg-card px-4 py-8 text-center">
          <p className="text-sm font-medium text-foreground">
            Não foi possível carregar os atestados
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

      {estado.tipo === "ok" && estado.atestados.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
          <p className="text-sm font-medium text-foreground">
            Nenhum atestado emitido
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Emita um atestado com motivo, período de afastamento e CID
            opcional.
          </p>
        </div>
      ) : null}

      {estado.tipo === "ok" && estado.atestados.length > 0 ? (
        <ul className="space-y-3">
          {estado.atestados.map((atestado) => (
            <li key={atestado.id}>
              <article className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-[13px] tabular-nums text-muted-foreground">
                    {formatadorData.format(new Date(atestado.emitidaEmIso))}
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {atestado.profissionalNome}
                  </p>
                  <p className="text-[13px] text-foreground">
                    {atestado.motivoResumo}
                  </p>
                  <p className="text-[13px] tabular-nums text-muted-foreground">
                    {atestado.periodoRotulo}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 shrink-0"
                  disabled={baixandoId === atestado.id}
                  onClick={() => void handleBaixarPdf(atestado.id)}
                >
                  <Download className="size-4" aria-hidden />
                  {baixandoId === atestado.id ? "Gerando…" : "Baixar PDF"}
                </Button>
              </article>
            </li>
          ))}
        </ul>
      ) : null}

      <EmitirAtestadoModal
        open={modalAberto}
        onOpenChange={setModalAberto}
        salvando={salvando}
        onSalvar={handleEmitir}
      />
    </section>
  );
}
