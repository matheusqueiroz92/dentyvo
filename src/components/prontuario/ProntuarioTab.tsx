"use client";

import { ClipboardList, Lock, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  atualizarAnamneseAction,
  carregarProntuarioTabAction,
  criarProntuarioAction,
  preencherAnamneseAction,
  registrarEvolucaoAction,
  retificarEvolucaoAction,
} from "@/actions/prontuario";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  AnamneseFormValues,
  RegistrarEvolucaoFormValues,
  RetificarEvolucaoFormValues,
} from "@/lib/prontuario/schema";
import type {
  AnamneseDTO,
  EvolucaoDTO,
  ProntuarioTabDTO,
} from "@/lib/prontuario/types";

import { OdontogramaChart } from "@/components/odontograma/OdontogramaChart";

import { AnamneseForm } from "./AnamneseForm";
import {
  AnamneseHistorico,
  AnamneseRespostasExibicao,
} from "./AnamneseHistorico";
import { CriarProntuarioCard } from "./CriarProntuarioCard";
import { EvolucaoTimeline } from "./EvolucaoTimeline";
import { AtestadosLista } from "./AtestadosLista";
import { ReceitasLista } from "./ReceitasLista";
import { RegistrarEvolucaoModal } from "./RegistrarEvolucaoModal";
import { RetificarEvolucaoModal } from "./RetificarEvolucaoModal";

type ProntuarioTabProps = {
  pacienteId: string;
  /** YYYY-MM-DD — usada no odontograma (visibilidade da dentição decídua). */
  dataNascimentoIso: string;
  /** false para recepção — mensagem de acesso restrito, sem chamar use cases. */
  podeAcessar: boolean;
  /** Specs 006/006b: só dentista emite/lista/PDF; admin sem CRO não vê as seções. */
  podeReceituario: boolean;
};

const formatadorData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

type EstadoCarga =
  | { tipo: "idle" | "carregando" }
  | { tipo: "erro"; mensagem: string }
  | { tipo: "ok"; dados: ProntuarioTabDTO };

export function ProntuarioTab({
  pacienteId,
  dataNascimentoIso,
  podeAcessar,
  podeReceituario,
}: ProntuarioTabProps) {
  const [estado, setEstado] = useState<EstadoCarga>(() =>
    podeAcessar ? { tipo: "carregando" } : { tipo: "idle" },
  );
  const [criando, setCriando] = useState(false);
  const [formAberto, setFormAberto] = useState(false);
  const [modoForm, setModoForm] = useState<"preencher" | "atualizar">(
    "preencher",
  );
  const [salvandoAnamnese, setSalvandoAnamnese] = useState(false);
  const [versaoHistoricoId, setVersaoHistoricoId] = useState<string | null>(
    null,
  );
  const [novaEvolucaoOpen, setNovaEvolucaoOpen] = useState(false);
  const [salvandoEvolucao, setSalvandoEvolucao] = useState(false);
  const [retificarOpen, setRetificarOpen] = useState(false);
  const [evolucaoParaRetificar, setEvolucaoParaRetificar] =
    useState<EvolucaoDTO | null>(null);
  const [salvandoRetificacao, setSalvandoRetificacao] = useState(false);

  const aplicarResultado = useCallback(
    (result: Awaited<ReturnType<typeof carregarProntuarioTabAction>>) => {
      if (result.serverError || !result.data) {
        setEstado({
          tipo: "erro",
          mensagem:
            result.serverError?.mensagem ??
            "Não foi possível carregar o prontuário.",
        });
        return;
      }

      setEstado({ tipo: "ok", dados: result.data });
      if (result.data.status === "prontuario") {
        setVersaoHistoricoId(result.data.versoes[0]?.id ?? null);
      } else {
        setVersaoHistoricoId(null);
      }
    },
    [],
  );

  useEffect(() => {
    if (!podeAcessar) return;

    let cancelado = false;
    void (async () => {
      const result = await carregarProntuarioTabAction({ pacienteId });
      if (cancelado) return;
      aplicarResultado(result);
    })();

    return () => {
      cancelado = true;
    };
  }, [pacienteId, podeAcessar, aplicarResultado]);

  async function recarregar() {
    if (!podeAcessar) return;
    setEstado({ tipo: "carregando" });
    const result = await carregarProntuarioTabAction({ pacienteId });
    aplicarResultado(result);
  }

  async function handleCriar() {
    setCriando(true);
    try {
      const result = await criarProntuarioAction({ pacienteId });
      if (result.serverError || !result.data) {
        toast.error(
          result.serverError?.mensagem ??
            "Não foi possível criar o prontuário.",
        );
        return;
      }
      toast.success("Prontuário criado.");
      await recarregar();
    } finally {
      setCriando(false);
    }
  }

  if (!podeAcessar) {
    return (
      <Alert variant="warning">
        <Lock aria-hidden />
        <AlertTitle>Acesso restrito</AlertTitle>
        <AlertDescription>
          O prontuário clínico, a anamnese e as evoluções são visíveis apenas
          para administradores e dentistas. Peça a um profissional autorizado se
          precisar consultar estes dados.
        </AlertDescription>
      </Alert>
    );
  }

  if (estado.tipo === "erro") {
    return (
      <div className="rounded-lg border border-border bg-card px-4 py-8 text-center">
        <p className="text-sm font-medium text-foreground">
          Não foi possível carregar o prontuário
        </p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {estado.mensagem}
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-4 min-h-11"
          onClick={() => void recarregar()}
        >
          <RefreshCw className="size-4" aria-hidden />
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (estado.tipo !== "ok") {
    return <ProntuarioSkeleton />;
  }

  const { dados } = estado;

  if (dados.status === "sem_prontuario") {
    return (
      <CriarProntuarioCard
        criando={criando}
        onCriar={() => void handleCriar()}
      />
    );
  }

  const { prontuario, anamneseVigente, versoes, evolucoes, procedimentos } =
    dados;
  const prontuarioId = prontuario.id;

  async function handleSalvarAnamnese(values: AnamneseFormValues) {
    setSalvandoAnamnese(true);
    try {
      const action =
        modoForm === "preencher"
          ? preencherAnamneseAction
          : atualizarAnamneseAction;
      const result = await action({
        prontuarioId,
        respostas: values,
      });

      if (result.serverError || !result.data) {
        toast.error(
          result.serverError?.mensagem ??
            "Não foi possível salvar a anamnese.",
        );
        return;
      }

      toast.success(
        modoForm === "preencher"
          ? "Anamnese preenchida."
          : "Nova versão da anamnese registrada.",
      );
      setFormAberto(false);
      await recarregar();
    } finally {
      setSalvandoAnamnese(false);
    }
  }

  async function handleRegistrarEvolucao(values: RegistrarEvolucaoFormValues) {
    setSalvandoEvolucao(true);
    try {
      const result = await registrarEvolucaoAction({
        prontuarioId,
        respostas: values,
      });
      if (result.serverError || !result.data) {
        toast.error(
          result.serverError?.mensagem ??
            "Não foi possível registrar a evolução.",
        );
        return;
      }
      toast.success("Evolução registrada.");
      setNovaEvolucaoOpen(false);
      await recarregar();
    } finally {
      setSalvandoEvolucao(false);
    }
  }

  async function handleRetificarEvolucao(values: RetificarEvolucaoFormValues) {
    if (!evolucaoParaRetificar) return;
    setSalvandoRetificacao(true);
    try {
      const result = await retificarEvolucaoAction({
        evolucaoId: evolucaoParaRetificar.id,
        respostas: values,
      });
      if (result.serverError || !result.data) {
        toast.error(
          result.serverError?.mensagem ??
            "Não foi possível retificar a evolução.",
        );
        return;
      }
      toast.success("Retificação registrada.");
      setRetificarOpen(false);
      setEvolucaoParaRetificar(null);
      await recarregar();
    } finally {
      setSalvandoRetificacao(false);
    }
  }

  return (
    <div className="space-y-8">
      <section
        className="space-y-3"
        aria-labelledby="prontuario-dados-gerais-titulo"
      >
        <div className="flex items-center gap-2">
          <ClipboardList className="size-4 text-muted-foreground" aria-hidden />
          <h2
            id="prontuario-dados-gerais-titulo"
            className="text-base font-semibold text-foreground"
          >
            Dados gerais
          </h2>
        </div>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <dt className="text-xs text-muted-foreground">Criado em</dt>
            <dd className="text-sm tabular-nums text-foreground">
              {formatadorData.format(new Date(prontuario.criadoEmIso))}
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="text-xs text-muted-foreground">Versões de anamnese</dt>
            <dd className="text-sm tabular-nums text-foreground">
              {versoes.length}
            </dd>
          </div>
        </dl>
      </section>

      <section className="space-y-4" aria-labelledby="anamnese-titulo">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2
            id="anamnese-titulo"
            className="text-base font-semibold text-foreground"
          >
            Anamnese
          </h2>
          {anamneseVigente ? (
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={() => {
                setModoForm("atualizar");
                setFormAberto(true);
              }}
            >
              Atualizar anamnese
            </Button>
          ) : (
            <Button
              type="button"
              className="min-h-11"
              onClick={() => {
                setModoForm("preencher");
                setFormAberto(true);
              }}
            >
              Preencher anamnese
            </Button>
          )}
        </div>

        {!anamneseVigente ? (
          <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
            <p className="text-sm font-medium text-foreground">
              Nenhuma anamnese registrada
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Preencha a anamnese inicial com histórico médico, alergias,
              medicações e condições preexistentes.
            </p>
          </div>
        ) : (
          <div className="space-y-3 rounded-lg border border-border bg-card p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
              <p className="text-sm font-medium text-foreground">
                Versão vigente (v{anamneseVigente.versao})
              </p>
              <p className="text-[13px] text-muted-foreground">
                Preenchida por {anamneseVigente.preenchidoPorNome} em{" "}
                <span className="tabular-nums">
                  {formatadorData.format(
                    new Date(anamneseVigente.preenchidoEmIso),
                  )}
                </span>
              </p>
            </div>
            <AnamneseRespostasExibicao respostas={anamneseVigente.respostas} />
          </div>
        )}

        {versoes.length > 0 ? (
          <AnamneseHistorico
            versoes={versoes}
            versaoSelecionadaId={versaoHistoricoId}
            onSelecionar={(v: AnamneseDTO) => setVersaoHistoricoId(v.id)}
          />
        ) : null}
      </section>

      <OdontogramaChart
        key={dataNascimentoIso}
        prontuarioId={prontuarioId}
        dataNascimentoIso={dataNascimentoIso}
      />

      <EvolucaoTimeline
        evolucoes={evolucoes}
        onNova={() => setNovaEvolucaoOpen(true)}
        onRetificar={(e) => {
          setEvolucaoParaRetificar(e);
          setRetificarOpen(true);
        }}
      />

      {podeReceituario ? <ReceitasLista prontuarioId={prontuarioId} /> : null}
      {podeReceituario ? <AtestadosLista prontuarioId={prontuarioId} /> : null}

      <AnamneseForm
        open={formAberto}
        onOpenChange={setFormAberto}
        modo={modoForm}
        valoresIniciais={
          modoForm === "atualizar" ? anamneseVigente?.respostas : null
        }
        salvando={salvandoAnamnese}
        onSalvar={handleSalvarAnamnese}
      />

      <RegistrarEvolucaoModal
        open={novaEvolucaoOpen}
        onOpenChange={setNovaEvolucaoOpen}
        procedimentos={procedimentos}
        salvando={salvandoEvolucao}
        onSalvar={handleRegistrarEvolucao}
      />

      <RetificarEvolucaoModal
        open={retificarOpen}
        onOpenChange={(open) => {
          setRetificarOpen(open);
          if (!open) setEvolucaoParaRetificar(null);
        }}
        original={evolucaoParaRetificar}
        salvando={salvandoRetificacao}
        onSalvar={handleRetificarEvolucao}
      />
    </div>
  );
}

function ProntuarioSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Carregando prontuário">
      <div className="space-y-3">
        <Skeleton className="h-5 w-40" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-40 w-full" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}
