"use client";

import { Smile, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  consultarOdontogramaVigenteAction,
  registrarEventosOdontogramaAction,
} from "@/actions/odontograma";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { EstadoOdontograma } from "@/core/odontograma/domain/EstadoOdontograma";
import { ehEstadoAusente } from "@/core/odontograma/domain/EstadoOdontograma";
import type { FaceOdontograma } from "@/core/odontograma/domain/FaceOdontograma";
import type {
  DenteVigenteDTO,
  EventoOdontogramaPendenteDTO,
  OdontogramaVigenteDTO,
} from "@/lib/odontograma/types";
import { deciduaVisivelPorPadrao } from "@/lib/odontograma/visibilidade-decidua";
import { cn } from "@/lib/utils";

import { DenteSvg, type EstadosFacesDente } from "./DenteSvg";
import { HistoricoDenteModal } from "./HistoricoDenteModal";
import { IlustracaoTipoDente } from "./IlustracaoTipoDente";
import { LegendaEstados } from "./LegendaEstados";
import { SeletorEstadoFace } from "./SeletorEstadoFace";

type Fileira = {
  id: string;
  label: string;
  numeros: number[];
  /** FDI acima (superior) ou abaixo (inferior) do ícone. */
  fdi: "acima" | "abaixo";
  decidua?: boolean;
};

type EstadoVisualDente = {
  ausente: boolean;
  faces: EstadosFacesDente;
  facesPendentes: Set<FaceOdontograma>;
  dentePendente: boolean;
};

const FILEIRAS: Fileira[] = [
  {
    id: "perm-sup",
    label: "Permanente superior",
    numeros: [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
    fdi: "acima",
  },
  {
    id: "dec-sup",
    label: "Decídua superior",
    numeros: [55, 54, 53, 52, 51, 61, 62, 63, 64, 65],
    fdi: "acima",
    decidua: true,
  },
  {
    id: "dec-inf",
    label: "Decídua inferior",
    numeros: [85, 84, 83, 82, 81, 71, 72, 73, 74, 75],
    fdi: "abaixo",
    decidua: true,
  },
  {
    id: "perm-inf",
    label: "Permanente inferior",
    numeros: [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38],
    fdi: "abaixo",
  },
];

type OdontogramaChartProps = {
  prontuarioId: string;
  /** YYYY-MM-DD — mesma base do header do paciente (`calcularIdade`). */
  dataNascimentoIso: string;
};

type FaceAlvo = { numeroDente: number; face: FaceOdontograma };

function chavePendencia(p: EventoOdontogramaPendenteDTO): string {
  if (p.nivel === "dente") return `${p.numeroDente}:dente`;
  return `${p.numeroDente}:face:${p.face}`;
}

type EstadoCarga =
  | { tipo: "carregando" }
  | { tipo: "erro"; mensagem: string }
  | { tipo: "ok"; vigente: OdontogramaVigenteDTO };

export function OdontogramaChart({
  prontuarioId,
  dataNascimentoIso,
}: OdontogramaChartProps) {
  const [mostrarDecidua, setMostrarDecidua] = useState(() =>
    deciduaVisivelPorPadrao(dataNascimentoIso),
  );
  const [estado, setEstado] = useState<EstadoCarga>({ tipo: "carregando" });
  const [pendencias, setPendencias] = useState<
    Map<string, EventoOdontogramaPendenteDTO>
  >(() => new Map());
  const [salvando, setSalvando] = useState(false);
  const [erroLote, setErroLote] = useState<string | null>(null);
  const [faceAlvo, setFaceAlvo] = useState<FaceAlvo | null>(null);
  const [seletorOpen, setSeletorOpen] = useState(false);
  const [historicoDente, setHistoricoDente] = useState<number | null>(null);
  const [historicoOpen, setHistoricoOpen] = useState(false);

  const fileirasVisiveis = useMemo(
    () => FILEIRAS.filter((f) => (f.decidua ? mostrarDecidua : true)),
    [mostrarDecidua],
  );

  const carregar = useCallback(async (mostrarLoading: boolean) => {
    if (mostrarLoading) {
      setEstado({ tipo: "carregando" });
    }
    const result = await consultarOdontogramaVigenteAction({ prontuarioId });
    if (result.serverError || !result.data) {
      setEstado({
        tipo: "erro",
        mensagem:
          result.serverError?.mensagem ??
          "Não foi possível carregar o odontograma.",
      });
      return;
    }
    setEstado({ tipo: "ok", vigente: result.data });
  }, [prontuarioId]);

  useEffect(() => {
    let cancelado = false;

    void (async () => {
      const result = await consultarOdontogramaVigenteAction({ prontuarioId });
      if (cancelado) return;
      if (result.serverError || !result.data) {
        setEstado({
          tipo: "erro",
          mensagem:
            result.serverError?.mensagem ??
            "Não foi possível carregar o odontograma.",
        });
        return;
      }
      setEstado({ tipo: "ok", vigente: result.data });
    })();

    return () => {
      cancelado = true;
    };
  }, [prontuarioId]);

  const dentePorNumero = useMemo(() => {
    if (estado.tipo !== "ok") return new Map<number, DenteVigenteDTO>();
    return new Map(estado.vigente.dentes.map((d) => [d.numeroDente, d]));
  }, [estado]);

  function resolverEstadoDente(numero: number): EstadoVisualDente {
    const vigente = dentePorNumero.get(numero);
    const faces: EstadosFacesDente = {};
    for (const f of vigente?.faces ?? []) {
      faces[f.face] = f.estado;
    }

    let ausente =
      vigente?.estadoDente != null && ehEstadoAusente(vigente.estadoDente);
    let dentePendente = false;
    const facesPendentes = new Set<FaceOdontograma>();

    for (const p of pendencias.values()) {
      if (p.numeroDente !== numero) continue;
      if (p.nivel === "dente") {
        ausente = ehEstadoAusente(p.estadoNovo);
        dentePendente = true;
      } else if (p.face) {
        faces[p.face] = p.estadoNovo;
        facesPendentes.add(p.face);
      }
    }

    if (ausente) {
      return {
        ausente: true,
        faces: {},
        facesPendentes: new Set(),
        dentePendente,
      };
    }

    return { ausente, faces, facesPendentes, dentePendente };
  }

  function upsertPendencia(p: EventoOdontogramaPendenteDTO) {
    setPendencias((prev) => {
      const next = new Map(prev);
      next.set(chavePendencia(p), p);
      if (p.nivel === "dente" && ehEstadoAusente(p.estadoNovo)) {
        for (const [k, v] of next) {
          if (v.numeroDente === p.numeroDente && v.nivel === "face") {
            next.delete(k);
          }
        }
      }
      return next;
    });
    setErroLote(null);
  }

  function handleFaceClick(numeroDente: number, face: FaceOdontograma) {
    const { ausente } = resolverEstadoDente(numeroDente);
    if (ausente) return;
    setFaceAlvo({ numeroDente, face });
    setSeletorOpen(true);
  }

  function handleSelecionarEstado(estadoNovo: EstadoOdontograma) {
    if (!faceAlvo) return;
    upsertPendencia({
      numeroDente: faceAlvo.numeroDente,
      nivel: "face",
      face: faceAlvo.face,
      estadoNovo,
    });
  }

  function handleToggleAusente(numeroDente: number) {
    const { ausente } = resolverEstadoDente(numeroDente);
    if (ausente) {
      upsertPendencia({
        numeroDente,
        nivel: "dente",
        face: null,
        estadoNovo: "higido",
      });
    } else {
      upsertPendencia({
        numeroDente,
        nivel: "dente",
        face: null,
        estadoNovo: "ausente_extraido",
      });
    }
  }

  function handleDescartar() {
    setPendencias(new Map());
    setErroLote(null);
  }

  async function handleSalvar() {
    if (pendencias.size === 0) return;
    setSalvando(true);
    setErroLote(null);
    try {
      const eventos = [...pendencias.values()].map((p) => ({
        numeroDente: p.numeroDente,
        nivel: p.nivel,
        face: p.nivel === "face" ? p.face : null,
        estadoNovo: p.estadoNovo,
      }));

      const result = await registrarEventosOdontogramaAction({
        prontuarioId,
        eventos,
      });

      if (result.serverError || !result.data) {
        const msg =
          result.serverError?.mensagem ??
          "Não foi possível salvar as alterações do odontograma.";
        setErroLote(msg);
        toast.error(msg);
        return;
      }

      toast.success(
        eventos.length === 1
          ? "1 alteração salva."
          : `${eventos.length} alterações salvas.`,
      );
      setPendencias(new Map());
      await carregar(true);
    } finally {
      setSalvando(false);
    }
  }

  const estadoAtualFace = (alvo: FaceAlvo | null): EstadoOdontograma => {
    if (!alvo) return "higido";
    return resolverEstadoDente(alvo.numeroDente).faces[alvo.face] ?? "higido";
  };

  const qtdPendencias = pendencias.size;

  return (
    <section className="space-y-4" aria-labelledby="odontograma-titulo">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Smile className="size-4 text-muted-foreground" aria-hidden />
          <h2
            id="odontograma-titulo"
            className="text-base font-semibold text-foreground"
          >
            Odontograma
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="min-h-11 text-[13px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline sm:min-h-0"
            onClick={() => setMostrarDecidua((v) => !v)}
            aria-pressed={mostrarDecidua}
          >
            {mostrarDecidua
              ? "Ocultar dentição decídua"
              : "Mostrar dentição decídua"}
          </button>
          {qtdPendencias > 0 ? (
            <>
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                disabled={salvando}
                onClick={handleDescartar}
              >
                <Trash2 className="size-4" aria-hidden />
                Descartar alterações
              </Button>
              <Button
                type="button"
                className="min-h-11"
                disabled={salvando}
                onClick={() => void handleSalvar()}
              >
                {salvando
                  ? "Salvando…"
                  : `Salvar alterações (${qtdPendencias} ${
                      qtdPendencias === 1
                        ? "alteração pendente"
                        : "alterações pendentes"
                    })`}
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {erroLote ? (
        <Alert variant="destructive" role="alert">
          <AlertTitle>Não foi possível salvar o lote</AlertTitle>
          <AlertDescription>{erroLote}</AlertDescription>
        </Alert>
      ) : null}

      {estado.tipo === "carregando" ? <OdontogramaSkeleton /> : null}

      {estado.tipo === "erro" ? (
        <div className="rounded-lg border border-destructive/40 bg-[hsl(var(--destructive-subtle))] px-4 py-6 text-center">
          <p className="text-sm font-medium text-[hsl(var(--destructive-subtle-foreground))]">
            {estado.mensagem}
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4 min-h-11"
            onClick={() => void carregar(true)}
          >
            Tentar novamente
          </Button>
        </div>
      ) : null}

      {estado.tipo === "ok" ? (
        <>
          <div className="space-y-5 overflow-x-auto rounded-lg border border-border bg-card p-3 sm:p-4">
            {fileirasVisiveis.map((fileira) => (
              <FileiraDentes
                key={fileira.id}
                fileira={fileira}
                resolver={resolverEstadoDente}
                onFaceClick={handleFaceClick}
                onToggleAusente={handleToggleAusente}
                onHistorico={(n) => {
                  setHistoricoDente(n);
                  setHistoricoOpen(true);
                }}
              />
            ))}
          </div>

          <p className="text-[13px] text-muted-foreground">
            Clique numa face para alterar o estado (fica pendente até salvar).
            Use ✕ para marcar ausente/extraído; H ou duplo clique para o
            histórico. Botão direito numa face também abre o controle de
            ausente.
          </p>

          <LegendaEstados />
        </>
      ) : null}

      {faceAlvo ? (
        <SeletorEstadoFace
          open={seletorOpen}
          onOpenChange={(open) => {
            setSeletorOpen(open);
            if (!open) setFaceAlvo(null);
          }}
          numeroDente={faceAlvo.numeroDente}
          face={faceAlvo.face}
          estadoAtual={estadoAtualFace(faceAlvo)}
          onSelecionar={handleSelecionarEstado}
        />
      ) : null}

      <HistoricoDenteModal
        key={historicoDente ?? "fechado"}
        open={historicoOpen && historicoDente != null}
        onOpenChange={(open) => {
          setHistoricoOpen(open);
          if (!open) setHistoricoDente(null);
        }}
        prontuarioId={prontuarioId}
        numeroDente={historicoDente ?? 0}
        ausente={
          historicoDente != null
            ? resolverEstadoDente(historicoDente).ausente
            : false
        }
      />
    </section>
  );
}

function FileiraDentes({
  fileira,
  resolver,
  onFaceClick,
  onToggleAusente,
  onHistorico,
}: {
  fileira: Fileira;
  resolver: (n: number) => EstadoVisualDente;
  onFaceClick: (numero: number, face: FaceOdontograma) => void;
  onToggleAusente: (numero: number) => void;
  onHistorico: (numero: number) => void;
}) {
  const meio = fileira.numeros.length / 2;

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{fileira.label}</p>
      <div className="flex flex-wrap items-end justify-center gap-x-0.5 gap-y-2 sm:gap-x-1">
        {fileira.numeros.map((numero, idx) => {
          const { ausente, faces, facesPendentes, dentePendente } =
            resolver(numero);
          const fdiEl = (
            <span className="text-[10px] tabular-nums text-muted-foreground">
              {numero}
            </span>
          );
          return (
            <div
              key={numero}
              className={cn(
                "flex flex-col items-center",
                idx === meio - 1 && "mr-2 sm:mr-3",
              )}
            >
              {fileira.fdi === "acima" ? fdiEl : null}
              <IlustracaoTipoDente
                numeroDente={numero}
                variante="grade"
                ausente={ausente}
              />
              <DenteSvg
                numeroDente={numero}
                estadosFaces={faces}
                ausente={ausente}
                facesPendentes={facesPendentes}
                dentePendente={dentePendente}
                onFaceClick={(face) => onFaceClick(numero, face)}
                onDenteClick={() => onToggleAusente(numero)}
                onHistorico={() => onHistorico(numero)}
              />
              {fileira.fdi === "abaixo" ? fdiEl : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OdontogramaSkeleton() {
  return (
    <div
      className="space-y-4"
      aria-busy="true"
      aria-label="Carregando odontograma"
    >
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}
