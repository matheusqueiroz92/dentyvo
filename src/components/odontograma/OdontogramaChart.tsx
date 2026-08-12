"use client";

import { Smile, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  consultarOdontogramaVigenteAction,
  registrarEventosOdontogramaAction,
} from "@/actions/odontograma";
import {
  GradeArcadas,
  ToggleDenticaoDecidua,
} from "@/components/domain/GradeArcadas";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { EstadoOdontograma } from "@/core/odontograma/domain/EstadoOdontograma";
import {
  ehEstadoDenteInteiro,
} from "@/core/odontograma/domain/EstadoOdontograma";
import type { FaceOdontograma } from "@/core/odontograma/domain/FaceOdontograma";
import { useVisibilidadeDecidua } from "@/hooks/useVisibilidadeDecidua";
import { ROTULOS_ESTADO } from "@/lib/odontograma/estados";
import type {
  DenteVigenteDTO,
  EventoOdontogramaPendenteDTO,
  OdontogramaVigenteDTO,
} from "@/lib/odontograma/types";
import type { ServerActionError } from "@/lib/safe-action";

import { DenteSvg, type EstadosFacesDente } from "./DenteSvg";
import { HistoricoDenteModal } from "./HistoricoDenteModal";
import { LegendaEstados } from "./LegendaEstados";
import {
  SeletorEstadoDenteInteiro,
  SeletorEstadoFace,
} from "./SeletorEstadoFace";

type EstadoVisualDente = {
  estadoDenteInteiro: EstadoOdontograma | null;
  faces: EstadosFacesDente;
  facesPendentes: Set<FaceOdontograma>;
  dentePendente: boolean;
};

type OdontogramaChartProps = {
  prontuarioId: string;
  dataNascimentoIso: string;
};

type FaceAlvo = { numeroDente: number; face: FaceOdontograma };

function chavePendencia(p: EventoOdontogramaPendenteDTO): string {
  if (p.nivel === "dente") return `${p.numeroDente}:dente`;
  return `${p.numeroDente}:face:${p.face}`;
}

function mensagemErroSalvar(erro: ServerActionError | undefined): string {
  if (!erro) {
    return "Não foi possível salvar as alterações do odontograma.";
  }
  if (erro.codigo === "EstadoDenteInteiroConflitanteError") {
    return (
      erro.mensagem ||
      "Já existe outro estado de dente inteiro ativo neste dente. " +
        "Não é possível registrar um segundo estado de dente inteiro diferente " +
        "sem antes voltar ao modo por face (registre um estado numa face)."
    );
  }
  return erro.mensagem;
}

type EstadoCarga =
  | { tipo: "carregando" }
  | { tipo: "erro"; mensagem: string }
  | { tipo: "ok"; vigente: OdontogramaVigenteDTO };

export function OdontogramaChart({
  prontuarioId,
  dataNascimentoIso,
}: OdontogramaChartProps) {
  const { mostrarDecidua, alternarDecidua } =
    useVisibilidadeDecidua(dataNascimentoIso);
  const [estado, setEstado] = useState<EstadoCarga>({ tipo: "carregando" });
  const [pendencias, setPendencias] = useState<
    Map<string, EventoOdontogramaPendenteDTO>
  >(() => new Map());
  const [salvando, setSalvando] = useState(false);
  const [erroLote, setErroLote] = useState<string | null>(null);
  const [faceAlvo, setFaceAlvo] = useState<FaceAlvo | null>(null);
  const [seletorFaceOpen, setSeletorFaceOpen] = useState(false);
  const [denteAlvo, setDenteAlvo] = useState<number | null>(null);
  const [seletorDenteOpen, setSeletorDenteOpen] = useState(false);
  const [historicoDente, setHistoricoDente] = useState<number | null>(null);
  const [historicoOpen, setHistoricoOpen] = useState(false);

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

    let estadoDenteInteiro: EstadoOdontograma | null =
      vigente?.estadoDente != null && ehEstadoDenteInteiro(vigente.estadoDente)
        ? vigente.estadoDente
        : null;
    let dentePendente = false;
    const facesPendentes = new Set<FaceOdontograma>();

    for (const p of pendencias.values()) {
      if (p.numeroDente !== numero) continue;
      if (p.nivel === "dente" && ehEstadoDenteInteiro(p.estadoNovo)) {
        estadoDenteInteiro = p.estadoNovo;
        dentePendente = true;
      } else if (p.nivel === "face" && p.face) {
        // Face pendente encerra otimisticamente o dente inteiro vigente.
        estadoDenteInteiro = null;
        faces[p.face] = p.estadoNovo;
        facesPendentes.add(p.face);
      }
    }

    if (estadoDenteInteiro != null) {
      return {
        estadoDenteInteiro,
        faces: {},
        facesPendentes: new Set(),
        dentePendente,
      };
    }

    return {
      estadoDenteInteiro: null,
      faces,
      facesPendentes,
      dentePendente,
    };
  }

  function upsertPendencia(p: EventoOdontogramaPendenteDTO) {
    setPendencias((prev) => {
      const next = new Map(prev);
      next.set(chavePendencia(p), p);
      if (p.nivel === "dente" && ehEstadoDenteInteiro(p.estadoNovo)) {
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
    setDenteAlvo(null);
    setSeletorDenteOpen(false);
    setFaceAlvo({ numeroDente, face });
    setSeletorFaceOpen(true);
  }

  function handleSelecionarEstadoFace(estadoNovo: EstadoOdontograma) {
    if (!faceAlvo) return;
    upsertPendencia({
      numeroDente: faceAlvo.numeroDente,
      nivel: "face",
      face: faceAlvo.face,
      estadoNovo,
    });
  }

  function handleDenteClick(numeroDente: number) {
    setFaceAlvo(null);
    setSeletorFaceOpen(false);
    setDenteAlvo(numeroDente);
    setSeletorDenteOpen(true);
  }

  function handleSelecionarEstadoDente(estadoNovo: EstadoOdontograma) {
    if (denteAlvo == null) return;
    const visual = resolverEstadoDente(denteAlvo);
    if (
      visual.estadoDenteInteiro != null &&
      visual.estadoDenteInteiro !== estadoNovo &&
      !visual.dentePendente
    ) {
      const atual = ROTULOS_ESTADO[visual.estadoDenteInteiro];
      const novo = ROTULOS_ESTADO[estadoNovo];
      toast.error(
        `O dente ${denteAlvo} já está como “${atual}”. Não é possível marcar “${novo}” sem antes voltar ao modo por face (clique numa face e registre um estado).`,
      );
      return;
    }
    upsertPendencia({
      numeroDente: denteAlvo,
      nivel: "dente",
      face: null,
      estadoNovo,
    });
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
        const msg = mensagemErroSalvar(
          result.serverError as ServerActionError | undefined,
        );
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
          <ToggleDenticaoDecidua
            mostrarDecidua={mostrarDecidua}
            onAlternar={alternarDecidua}
          />
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
          <GradeArcadas
            mostrarDecidua={mostrarDecidua}
            denteAusente={(n) =>
              resolverEstadoDente(n).estadoDenteInteiro === "ausente_extraido"
            }
            renderConteudoDente={(numero) => {
              const {
                estadoDenteInteiro,
                faces,
                facesPendentes,
                dentePendente,
              } = resolverEstadoDente(numero);
              return (
                <DenteSvg
                  numeroDente={numero}
                  estadosFaces={faces}
                  estadoDenteInteiro={estadoDenteInteiro}
                  facesPendentes={facesPendentes}
                  dentePendente={dentePendente}
                  onFaceClick={(face) => handleFaceClick(numero, face)}
                  onDenteClick={() => handleDenteClick(numero)}
                  onHistorico={() => {
                    setHistoricoDente(numero);
                    setHistoricoOpen(true);
                  }}
                />
              );
            }}
          />

          <p className="text-[13px] text-muted-foreground">
            Clique numa face para estados por face (hígido, cariado…). Use ✕ / D
            ou botão direito para estados de dente inteiro (ausente, implante,
            coroa…). Registrar uma face num dente com estado de dente inteiro
            encerra esse estado. H ou duplo clique abre o histórico.
          </p>

          <LegendaEstados />
        </>
      ) : null}

      {faceAlvo ? (
        <SeletorEstadoFace
          open={seletorFaceOpen}
          onOpenChange={(open) => {
            setSeletorFaceOpen(open);
            if (!open) setFaceAlvo(null);
          }}
          numeroDente={faceAlvo.numeroDente}
          face={faceAlvo.face}
          estadoAtual={estadoAtualFace(faceAlvo)}
          onSelecionar={handleSelecionarEstadoFace}
        />
      ) : null}

      {denteAlvo != null ? (
        <SeletorEstadoDenteInteiro
          open={seletorDenteOpen}
          onOpenChange={(open) => {
            setSeletorDenteOpen(open);
            if (!open) setDenteAlvo(null);
          }}
          numeroDente={denteAlvo}
          estadoAtual={resolverEstadoDente(denteAlvo).estadoDenteInteiro}
          onSelecionar={handleSelecionarEstadoDente}
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
            ? resolverEstadoDente(historicoDente).estadoDenteInteiro ===
              "ausente_extraido"
            : false
        }
      />
    </section>
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
