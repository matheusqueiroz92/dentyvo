"use client";

import { ClipboardList, Download, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { listarOpcoesAgendaAction } from "@/actions/agendamento";
import {
  aceitarOrcamentoAction,
  emitirOrcamentoAction,
  gerarPdfOrcamentoAction,
  listarOrcamentosDoProntuarioAction,
  recusarOrcamentoAction,
  resolverContextoOrcamentoAction,
} from "@/actions/orcamento";
import { NovoAgendamentoModal } from "@/components/agenda/NovoAgendamentoModal";
import { StatusOrcamentoBadge } from "@/components/domain/StatusOrcamentoBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { OpcaoSelect } from "@/lib/agenda/types";
import type { EmitirOrcamentoFormValues } from "@/lib/orcamento/schema";
import type {
  OrcamentoListaDTO,
  ProcedimentoOrcamentoOpcao,
} from "@/lib/orcamento/types";
import { baixarPdfBase64 } from "@/lib/receituario/download-pdf";

import { DetalhesOrcamentoModal } from "./DetalhesOrcamentoModal";
import { EmitirOrcamentoModal } from "./EmitirOrcamentoModal";

type OrcamentosListaProps = {
  pacienteId: string;
  pacienteNome: string;
  /** Quando já conhecido (aba clínica); se omitido, resolve via action. */
  prontuarioIdInicial?: string | null;
};

const formatadorData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

const formatadorDataCivil = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeZone: "UTC",
});

const formatadorMoeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

type EstadoCarga =
  | { tipo: "carregando" }
  | { tipo: "erro"; mensagem: string }
  | { tipo: "sem_prontuario" }
  | {
      tipo: "ok";
      prontuarioId: string;
      orcamentos: OrcamentoListaDTO[];
      procedimentos: ProcedimentoOrcamentoOpcao[];
    };

export function OrcamentosLista({
  pacienteId,
  pacienteNome,
  prontuarioIdInicial,
}: OrcamentosListaProps) {
  const [estado, setEstado] = useState<EstadoCarga>({ tipo: "carregando" });
  const [emitirAberto, setEmitirAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [detalhe, setDetalhe] = useState<OrcamentoListaDTO | null>(null);
  const [detalheAberto, setDetalheAberto] = useState(false);
  const [decidindo, setDecidindo] = useState(false);
  const [baixandoId, setBaixandoId] = useState<string | null>(null);
  const [agendarAberto, setAgendarAberto] = useState(false);
  const [opcoesAgenda, setOpcoesAgenda] = useState<{
    pacientes: OpcaoSelect[];
    profissionais: OpcaoSelect[];
    procedimentos: OpcaoSelect[];
  } | null>(null);
  const [agendarDefaults, setAgendarDefaults] = useState<{
    pacienteId: string;
    procedimentoId: string;
  } | null>(null);

  const carregar = useCallback(
    async (mostrarLoading: boolean) => {
      if (mostrarLoading) {
        setEstado({ tipo: "carregando" });
      }

      const contexto = await resolverContextoOrcamentoAction({ pacienteId });
      if (contexto.serverError || !contexto.data) {
        setEstado({
          tipo: "erro",
          mensagem:
            contexto.serverError?.mensagem ??
            "Não foi possível carregar o contexto do orçamento.",
        });
        return;
      }

      const prontuarioId =
        prontuarioIdInicial ?? contexto.data.prontuarioId;

      if (!prontuarioId) {
        setEstado({ tipo: "sem_prontuario" });
        return;
      }

      const result = await listarOrcamentosDoProntuarioAction({ prontuarioId });
      if (result.serverError || !result.data) {
        setEstado({
          tipo: "erro",
          mensagem:
            result.serverError?.mensagem ??
            "Não foi possível carregar os orçamentos.",
        });
        return;
      }

      setEstado({
        tipo: "ok",
        prontuarioId,
        orcamentos: result.data,
        procedimentos: contexto.data.procedimentos,
      });
    },
    [pacienteId, prontuarioIdInicial],
  );

  useEffect(() => {
    let cancelado = false;

    void (async () => {
      const contexto = await resolverContextoOrcamentoAction({ pacienteId });
      if (cancelado) return;
      if (contexto.serverError || !contexto.data) {
        setEstado({
          tipo: "erro",
          mensagem:
            contexto.serverError?.mensagem ??
            "Não foi possível carregar o contexto do orçamento.",
        });
        return;
      }

      const prontuarioId =
        prontuarioIdInicial ?? contexto.data.prontuarioId;

      if (!prontuarioId) {
        setEstado({ tipo: "sem_prontuario" });
        return;
      }

      const result = await listarOrcamentosDoProntuarioAction({
        prontuarioId,
      });
      if (cancelado) return;
      if (result.serverError || !result.data) {
        setEstado({
          tipo: "erro",
          mensagem:
            result.serverError?.mensagem ??
            "Não foi possível carregar os orçamentos.",
        });
        return;
      }

      setEstado({
        tipo: "ok",
        prontuarioId,
        orcamentos: result.data,
        procedimentos: contexto.data.procedimentos,
      });
    })();

    return () => {
      cancelado = true;
    };
  }, [pacienteId, prontuarioIdInicial]);

  async function handleEmitir(values: EmitirOrcamentoFormValues) {
    if (estado.tipo !== "ok") return;
    setSalvando(true);
    try {
      const result = await emitirOrcamentoAction({
        prontuarioId: estado.prontuarioId,
        itens: values.itens,
        validoAte: values.validoAte ?? "",
      });
      if (result.serverError || !result.data) {
        toast.error(
          result.serverError?.mensagem ??
            "Não foi possível emitir o orçamento.",
        );
        return;
      }
      toast.success("Orçamento emitido.");
      setEmitirAberto(false);
      await carregar(false);
    } finally {
      setSalvando(false);
    }
  }

  async function handleBaixarPdf(orcamentoId: string) {
    setBaixandoId(orcamentoId);
    try {
      const result = await gerarPdfOrcamentoAction({ orcamentoId });
      if (result.serverError || !result.data) {
        toast.error(
          result.serverError?.mensagem ??
            "Não foi possível gerar o PDF do orçamento.",
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

  async function handleAceitar() {
    if (!detalhe) return;
    setDecidindo(true);
    try {
      const result = await aceitarOrcamentoAction({
        orcamentoId: detalhe.id,
      });
      if (result.serverError || !result.data) {
        if (result.serverError?.codigo === "OrcamentoStatusConflitoError") {
          toast.error(
            "Este orçamento já foi atualizado por outra ação, atualize a página",
          );
          setDetalheAberto(false);
          await carregar(false);
          return;
        }
        toast.error(
          result.serverError?.mensagem ??
            "Não foi possível aceitar o orçamento.",
        );
        return;
      }
      toast.success("Orçamento marcado como aceito.");
      setDetalhe(result.data);
      await carregar(false);
    } finally {
      setDecidindo(false);
    }
  }

  async function handleRecusar() {
    if (!detalhe) return;
    setDecidindo(true);
    try {
      const result = await recusarOrcamentoAction({
        orcamentoId: detalhe.id,
      });
      if (result.serverError || !result.data) {
        if (result.serverError?.codigo === "OrcamentoStatusConflitoError") {
          toast.error(
            "Este orçamento já foi atualizado por outra ação, atualize a página",
          );
          setDetalheAberto(false);
          await carregar(false);
          return;
        }
        toast.error(
          result.serverError?.mensagem ??
            "Não foi possível recusar o orçamento.",
        );
        return;
      }
      toast.success("Orçamento marcado como recusado.");
      setDetalhe(result.data);
      await carregar(false);
    } finally {
      setDecidindo(false);
    }
  }

  async function handleAgendarItem(procedimentoId: string) {
    if (!opcoesAgenda) {
      const result = await listarOpcoesAgendaAction();
      if (result.serverError || !result.data) {
        toast.error(
          result.serverError?.mensagem ??
            "Não foi possível carregar opções da agenda.",
        );
        return;
      }
      setOpcoesAgenda(result.data);
    }
    setAgendarDefaults({ pacienteId, procedimentoId });
    setAgendarAberto(true);
  }

  return (
    <section className="space-y-4" aria-labelledby="orcamento-titulo">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-4 text-muted-foreground" aria-hidden />
          <h2
            id="orcamento-titulo"
            className="text-base font-semibold text-foreground"
          >
            Orçamentos
          </h2>
        </div>
        {estado.tipo === "ok" ? (
          <Button
            type="button"
            className="min-h-11"
            onClick={() => setEmitirAberto(true)}
          >
            Novo orçamento
          </Button>
        ) : null}
      </div>

      {estado.tipo === "carregando" ? (
        <div
          className="space-y-3"
          aria-busy="true"
          aria-label="Carregando orçamentos"
        >
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : null}

      {estado.tipo === "erro" ? (
        <div className="rounded-lg border border-border bg-card px-4 py-8 text-center">
          <p className="text-sm font-medium text-foreground">
            Não foi possível carregar os orçamentos
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

      {estado.tipo === "sem_prontuario" ? (
        <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
          <p className="text-sm font-medium text-foreground">
            Prontuário ainda não criado
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Um administrador ou dentista precisa criar o prontuário antes de
            emitir orçamentos para {pacienteNome}.
          </p>
        </div>
      ) : null}

      {estado.tipo === "ok" && estado.orcamentos.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
          <p className="text-sm font-medium text-foreground">
            Nenhum orçamento emitido
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Emita uma proposta com procedimentos, valores ajustáveis e validade
            opcional.
          </p>
        </div>
      ) : null}

      {estado.tipo === "ok" && estado.orcamentos.length > 0 ? (
        <ul className="space-y-3">
          {estado.orcamentos.map((orcamento) => (
            <li key={orcamento.id}>
              <article className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  className="min-h-11 flex-1 space-y-1 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => {
                    setDetalhe(orcamento);
                    setDetalheAberto(true);
                  }}
                >
                  <p className="text-[13px] tabular-nums text-muted-foreground">
                    {formatadorData.format(new Date(orcamento.emitidoEmIso))}
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {orcamento.profissionalNome}
                  </p>
                  <p className="text-sm tabular-nums text-foreground">
                    {formatadorMoeda.format(orcamento.total)}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <StatusOrcamentoBadge status={orcamento.status} />
                    {orcamento.validoAteIso ? (
                      <span className="text-[13px] tabular-nums text-muted-foreground">
                        Válido até{" "}
                        {formatadorDataCivil.format(
                          new Date(
                            `${orcamento.validoAteIso}T00:00:00.000Z`,
                          ),
                        )}
                      </span>
                    ) : null}
                  </div>
                </button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 shrink-0"
                  disabled={baixandoId === orcamento.id}
                  onClick={() => void handleBaixarPdf(orcamento.id)}
                >
                  <Download className="size-4" aria-hidden />
                  {baixandoId === orcamento.id ? "Gerando…" : "Baixar PDF"}
                </Button>
              </article>
            </li>
          ))}
        </ul>
      ) : null}

      {estado.tipo === "ok" ? (
        <EmitirOrcamentoModal
          open={emitirAberto}
          onOpenChange={setEmitirAberto}
          salvando={salvando}
          procedimentos={estado.procedimentos}
          onSalvar={handleEmitir}
        />
      ) : null}

      <DetalhesOrcamentoModal
        open={detalheAberto}
        onOpenChange={setDetalheAberto}
        orcamento={detalhe}
        decidindo={decidindo}
        baixandoPdf={baixandoId === detalhe?.id}
        onAceitar={() => void handleAceitar()}
        onRecusar={() => void handleRecusar()}
        onBaixarPdf={() => {
          if (detalhe) void handleBaixarPdf(detalhe.id);
        }}
        onAgendarItem={(procedimentoId) => {
          void handleAgendarItem(procedimentoId);
        }}
      />

      {opcoesAgenda && agendarDefaults ? (
        <NovoAgendamentoModal
          open={agendarAberto}
          onOpenChange={setAgendarAberto}
          pacientes={opcoesAgenda.pacientes}
          profissionais={opcoesAgenda.profissionais}
          procedimentos={opcoesAgenda.procedimentos}
          defaults={{
            pacienteId: agendarDefaults.pacienteId,
            procedimentoId: agendarDefaults.procedimentoId,
          }}
          onCriado={() => {
            toast.success("Consulta marcada a partir do orçamento.");
          }}
        />
      ) : null}
    </section>
  );
}
