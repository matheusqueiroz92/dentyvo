"use client";

import { Activity, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  consultarPeriogramaAction,
  listarPeriogramasDoProntuarioAction,
  registrarPeriogramaAction,
} from "@/actions/periograma";
import {
  GradeArcadas,
  ToggleDenticaoDecidua,
} from "@/components/domain/GradeArcadas";
import { DentePeriogramaPanel } from "@/components/periograma/DentePeriogramaPanel";
import { PeriogramaHistorico } from "@/components/periograma/PeriogramaHistorico";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { TipoPeriograma } from "@/core/periograma/domain/Periograma";
import { useVisibilidadeDecidua } from "@/hooks/useVisibilidadeDecidua";
import {
  denteParaPayload,
  denteTemDados,
  ROTULOS_TIPO_PERIOGRAMA,
} from "@/lib/periograma/helpers";
import type {
  DentePeriogramaDTO,
  PeriogramaDTO,
  PeriogramaListaDTO,
} from "@/lib/periograma/types";
import type { ServerActionError } from "@/lib/safe-action";
import { cn } from "@/lib/utils";

type PeriogramaChartProps = {
  prontuarioId: string;
  dataNascimentoIso: string;
};

type EstadoLista =
  | { tipo: "carregando" }
  | { tipo: "erro"; mensagem: string }
  | { tipo: "ok"; lista: PeriogramaListaDTO[] };

type SessaoExame = {
  tipo: TipoPeriograma;
  dentes: Map<number, DentePeriogramaDTO>;
};

type ModoVisualizacao =
  | { tipo: "idle" }
  | { tipo: "sessao"; sessao: SessaoExame }
  | {
      tipo: "leitura";
      periogramaId: string;
      detalhe: PeriogramaDTO | null;
      carregando: boolean;
      erro: string | null;
    };

function mensagemErroSalvar(
  erro: ServerActionError | undefined,
): string {
  if (!erro) {
    return "Não foi possível salvar o periograma.";
  }
  return erro.mensagem;
}

export function PeriogramaChart({
  prontuarioId,
  dataNascimentoIso,
}: PeriogramaChartProps) {
  const { mostrarDecidua, alternarDecidua } =
    useVisibilidadeDecidua(dataNascimentoIso);
  const [listaEstado, setListaEstado] = useState<EstadoLista>({
    tipo: "carregando",
  });
  const [modo, setModo] = useState<ModoVisualizacao>({ tipo: "idle" });
  const [denteAberto, setDenteAberto] = useState<number | null>(null);
  const [painelOpen, setPainelOpen] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);

  const carregarLista = useCallback(
    async (mostrarLoading: boolean) => {
      if (mostrarLoading) {
        setListaEstado({ tipo: "carregando" });
      }
      const result = await listarPeriogramasDoProntuarioAction({
        prontuarioId,
      });
      if (result.serverError || !result.data) {
        setListaEstado({
          tipo: "erro",
          mensagem:
            result.serverError?.mensagem ??
            "Não foi possível carregar os periogramas.",
        });
        return;
      }
      setListaEstado({ tipo: "ok", lista: result.data });
    },
    [prontuarioId],
  );

  useEffect(() => {
    let cancelado = false;
    void (async () => {
      const result = await listarPeriogramasDoProntuarioAction({
        prontuarioId,
      });
      if (cancelado) return;
      if (result.serverError || !result.data) {
        setListaEstado({
          tipo: "erro",
          mensagem:
            result.serverError?.mensagem ??
            "Não foi possível carregar os periogramas.",
        });
        return;
      }
      setListaEstado({ tipo: "ok", lista: result.data });
    })();
    return () => {
      cancelado = true;
    };
  }, [prontuarioId]);

  const tipoSugerido: TipoPeriograma = useMemo(() => {
    if (listaEstado.tipo !== "ok") return "exame_inicial";
    return listaEstado.lista.length === 0 ? "exame_inicial" : "reavaliacao";
  }, [listaEstado]);

  function iniciarSessao() {
    setErroSalvar(null);
    setModo({
      tipo: "sessao",
      sessao: { tipo: tipoSugerido, dentes: new Map() },
    });
  }

  function descartarSessao() {
    setErroSalvar(null);
    setPainelOpen(false);
    setDenteAberto(null);
    setModo({ tipo: "idle" });
  }

  function atualizarTipoSessao(tipo: TipoPeriograma) {
    setModo((prev) => {
      if (prev.tipo !== "sessao") return prev;
      return { ...prev, sessao: { ...prev.sessao, tipo } };
    });
  }

  async function abrirHistorico(item: PeriogramaListaDTO) {
    setErroSalvar(null);
    setPainelOpen(false);
    setDenteAberto(null);
    setModo({
      tipo: "leitura",
      periogramaId: item.id,
      detalhe: null,
      carregando: true,
      erro: null,
    });

    const result = await consultarPeriogramaAction({
      periogramaId: item.id,
    });
    if (result.serverError || !result.data) {
      setModo({
        tipo: "leitura",
        periogramaId: item.id,
        detalhe: null,
        carregando: false,
        erro:
          result.serverError?.mensagem ??
          "Não foi possível carregar este exame.",
      });
      return;
    }
    setModo({
      tipo: "leitura",
      periogramaId: item.id,
      detalhe: result.data,
      carregando: false,
      erro: null,
    });
  }

  function fecharLeitura() {
    setPainelOpen(false);
    setDenteAberto(null);
    setModo({ tipo: "idle" });
  }

  function handleDenteClick(numero: number) {
    if (modo.tipo === "idle") return;
    if (modo.tipo === "leitura" && (modo.carregando || !modo.detalhe)) return;
    setDenteAberto(numero);
    setPainelOpen(true);
  }

  function valorInicialPainel(): DentePeriogramaDTO | null {
    if (denteAberto == null) return null;
    if (modo.tipo === "sessao") {
      return modo.sessao.dentes.get(denteAberto) ?? null;
    }
    if (modo.tipo === "leitura" && modo.detalhe) {
      return (
        modo.detalhe.dentes.find((d) => d.numeroDente === denteAberto) ?? null
      );
    }
    return null;
  }

  function handleConfirmarDente(dente: DentePeriogramaDTO) {
    setModo((prev) => {
      if (prev.tipo !== "sessao") return prev;
      const next = new Map(prev.sessao.dentes);
      if (denteTemDados(dente)) {
        next.set(dente.numeroDente, dente);
      } else {
        next.delete(dente.numeroDente);
      }
      return { ...prev, sessao: { ...prev.sessao, dentes: next } };
    });
  }

  function denteMarcado(numero: number): boolean {
    if (modo.tipo === "sessao") {
      return modo.sessao.dentes.has(numero);
    }
    if (modo.tipo === "leitura" && modo.detalhe) {
      return modo.detalhe.dentes.some((d) => d.numeroDente === numero);
    }
    return false;
  }

  async function handleSalvar() {
    if (modo.tipo !== "sessao") return;
    const dentes = [...modo.sessao.dentes.values()]
      .filter(denteTemDados)
      .map(denteParaPayload);
    if (dentes.length === 0) {
      toast.error("Preencha ao menos um dente antes de salvar.");
      return;
    }

    setSalvando(true);
    setErroSalvar(null);
    try {
      const result = await registrarPeriogramaAction({
        prontuarioId,
        tipo: modo.sessao.tipo,
        dentes,
      });
      if (result.serverError || !result.data) {
        const msg = mensagemErroSalvar(
          result.serverError as ServerActionError | undefined,
        );
        setErroSalvar(msg);
        toast.error(msg);
        return;
      }
      toast.success(
        `Periograma salvo (${ROTULOS_TIPO_PERIOGRAMA[result.data.tipo]}).`,
      );
      setModo({ tipo: "idle" });
      await carregarLista(false);
    } finally {
      setSalvando(false);
    }
  }

  const qtdDentesSessao =
    modo.tipo === "sessao" ? modo.sessao.dentes.size : 0;
  const emSessao = modo.tipo === "sessao";
  const emLeitura = modo.tipo === "leitura";
  const gradeAtiva = emSessao || (emLeitura && modo.detalhe != null);

  return (
    <section className="space-y-4" aria-labelledby="periograma-titulo">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-muted-foreground" aria-hidden />
          <h2
            id="periograma-titulo"
            className="text-base font-semibold text-foreground"
          >
            Periograma
          </h2>
          {emLeitura && modo.detalhe ? (
            <Badge variant="secondary">
              Somente leitura · {ROTULOS_TIPO_PERIOGRAMA[modo.detalhe.tipo]}
            </Badge>
          ) : null}
          {emSessao ? (
            <Badge variant="outline">Sessão em andamento</Badge>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ToggleDenticaoDecidua
            mostrarDecidua={mostrarDecidua}
            onAlternar={alternarDecidua}
          />
          {!emSessao && !emLeitura ? (
            <Button
              type="button"
              className="min-h-11"
              onClick={iniciarSessao}
              disabled={listaEstado.tipo === "carregando"}
            >
              Novo exame periodontal
            </Button>
          ) : null}
          {emLeitura ? (
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={fecharLeitura}
            >
              Voltar
            </Button>
          ) : null}
          {emSessao ? (
            <>
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                disabled={salvando}
                onClick={descartarSessao}
              >
                <Trash2 className="size-4" aria-hidden />
                Descartar sessão
              </Button>
              <Button
                type="button"
                className="min-h-11"
                disabled={salvando || qtdDentesSessao === 0}
                onClick={() => void handleSalvar()}
              >
                {salvando
                  ? "Salvando…"
                  : `Salvar periograma (${qtdDentesSessao} ${
                      qtdDentesSessao === 1 ? "dente" : "dentes"
                    })`}
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {emSessao ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="tipo-exame">Tipo do exame</Label>
            <Select
              value={modo.sessao.tipo}
              onValueChange={(v) =>
                atualizarTipoSessao(v as TipoPeriograma)
              }
            >
              <SelectTrigger id="tipo-exame" className="min-h-11 w-full sm:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="exame_inicial">
                  {ROTULOS_TIPO_PERIOGRAMA.exame_inicial}
                </SelectItem>
                <SelectItem value="reavaliacao">
                  {ROTULOS_TIPO_PERIOGRAMA.reavaliacao}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-[13px] text-muted-foreground sm:pb-2">
            Sugerido automaticamente:{" "}
            {ROTULOS_TIPO_PERIOGRAMA[tipoSugerido].toLowerCase()}. Você pode
            alterar se fizer sentido clinicamente.
          </p>
        </div>
      ) : null}

      {erroSalvar ? (
        <Alert variant="destructive" role="alert">
          <AlertTitle>Não foi possível salvar o periograma</AlertTitle>
          <AlertDescription>{erroSalvar}</AlertDescription>
        </Alert>
      ) : null}

      {listaEstado.tipo === "carregando" && modo.tipo === "idle" ? (
        <PeriogramaSkeleton />
      ) : null}

      {listaEstado.tipo === "erro" ? (
        <div className="rounded-lg border border-destructive/40 bg-[hsl(var(--destructive-subtle))] px-4 py-6 text-center">
          <p className="text-sm font-medium text-[hsl(var(--destructive-subtle-foreground))]">
            {listaEstado.mensagem}
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4 min-h-11"
            onClick={() => void carregarLista(true)}
          >
            Tentar novamente
          </Button>
        </div>
      ) : null}

      {emLeitura && modo.carregando ? <PeriogramaSkeleton /> : null}

      {emLeitura && modo.erro ? (
        <Alert variant="destructive" role="alert">
          <AlertTitle>Erro ao abrir exame</AlertTitle>
          <AlertDescription>{modo.erro}</AlertDescription>
        </Alert>
      ) : null}

      {gradeAtiva ? (
        <>
          <GradeArcadas
            mostrarDecidua={mostrarDecidua}
            denteClassName={(n) =>
              denteMarcado(n)
                ? "rounded-md ring-2 ring-primary ring-offset-2 ring-offset-background"
                : undefined
            }
            renderConteudoDente={(numero) => (
              <button
                type="button"
                className={cn(
                  "mt-0.5 flex size-9 min-h-11 min-w-11 items-center justify-center rounded-md border text-[11px] tabular-nums transition-colors",
                  denteMarcado(numero)
                    ? "border-primary bg-primary/10 font-semibold text-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                  modo.tipo === "leitura" && "cursor-default",
                )}
                onClick={() => handleDenteClick(numero)}
                aria-label={
                  denteMarcado(numero)
                    ? `Dente ${numero} com dados — ${
                        emLeitura ? "visualizar" : "editar na sessão"
                      }`
                    : `Dente ${numero} — ${
                        emLeitura
                          ? "sem dados neste exame"
                          : "preencher na sessão"
                      }`
                }
                disabled={emLeitura && !denteMarcado(numero)}
              >
                {denteMarcado(numero) ? "●" : "○"}
              </button>
            )}
          />
          <p className="text-[13px] text-muted-foreground">
            {emSessao
              ? "Clique num dente para registrar pontos de sondagem. Contorno destacado = já tem dados nesta sessão (ainda não salvos)."
              : "Visualização somente leitura do exame selecionado. Contorno destacado = dente com dados neste exame."}
          </p>
        </>
      ) : null}

      {listaEstado.tipo === "ok" && !emSessao ? (
        <PeriogramaHistorico
          periogramas={listaEstado.lista}
          selecionadoId={emLeitura ? modo.periogramaId : null}
          onSelecionar={(item) => void abrirHistorico(item)}
          carregandoDetalhe={emLeitura && modo.carregando}
        />
      ) : null}

      <DentePeriogramaPanel
        key={`${modo.tipo}-${denteAberto ?? "none"}-${
          emLeitura ? modo.periogramaId : "sessao"
        }`}
        open={painelOpen && denteAberto != null}
        onOpenChange={(open) => {
          setPainelOpen(open);
          if (!open) setDenteAberto(null);
        }}
        numeroDente={denteAberto}
        valorInicial={valorInicialPainel()}
        somenteLeitura={emLeitura}
        onConfirmar={emSessao ? handleConfirmarDente : undefined}
      />
    </section>
  );
}

function PeriogramaSkeleton() {
  return (
    <div
      className="space-y-4"
      aria-busy="true"
      aria-label="Carregando periograma"
    >
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}
