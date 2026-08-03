"use client";

import { CalendarPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import {
  cancelarConsultaAction,
  confirmarConsultaAction,
  listarAgendamentosPeriodoAction,
} from "@/actions/agendamento";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  adicionarDias,
  formatarDataCompleta,
  periodoParaModo,
} from "@/lib/agenda/periodo";
import type {
  AgendaContextoCliente,
  AgendaModo,
  AgendamentoAgendaDTO,
  OpcaoSelect,
} from "@/lib/agenda/types";

import { AgendaGrid } from "./AgendaGrid";
import { AgendaLista } from "./AgendaLista";
import { DetalhesAgendamentoModal } from "./DetalhesAgendamentoModal";
import { NovoAgendamentoModal } from "./NovoAgendamentoModal";

const ABA_STORAGE_KEY = "dentyvo.agenda.aba";

type AgendaPageClientProps = {
  contexto: AgendaContextoCliente;
  iniciais: AgendamentoAgendaDTO[];
  dataInicioIso: string;
  dataFimIso: string;
  modoInicial: AgendaModo;
  referenciaIso: string;
  profissionais: OpcaoSelect[];
  pacientes: OpcaoSelect[];
  procedimentos: OpcaoSelect[];
};

export function AgendaPageClient({
  contexto,
  iniciais,
  dataInicioIso,
  dataFimIso,
  modoInicial,
  referenciaIso,
  profissionais,
  pacientes,
  procedimentos,
}: AgendaPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const abaQs = searchParams.get("aba");
  const aba: "quadro" | "lista" = abaQs === "lista" ? "lista" : "quadro";

  const [modo, setModo] = useState<AgendaModo>(modoInicial);
  const [referencia, setReferencia] = useState(() => new Date(referenciaIso));
  const [periodo, setPeriodo] = useState({
    inicio: dataInicioIso,
    fim: dataFimIso,
  });
  const [agendamentos, setAgendamentos] =
    useState<AgendamentoAgendaDTO[]>(iniciais);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [novoOpen, setNovoOpen] = useState(
    () => searchParams.get("nova") === "1",
  );
  const [novoDefaults, setNovoDefaults] = useState<
    { profissionalId?: string; dataHoraInicioIso?: string } | undefined
  >();
  const [detalhe, setDetalhe] = useState<AgendamentoAgendaDTO | null>(null);

  useEffect(() => {
    if (searchParams.get("aba")) return;
    const salva = localStorage.getItem(ABA_STORAGE_KEY);
    if (salva !== "lista" && salva !== "quadro") return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("aba", salva);
    router.replace(`/agenda?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const carregarPeriodo = useCallback(
    async (ref: Date, m: AgendaModo) => {
      setCarregando(true);
      setErro(null);
      const { dataInicio, dataFim } = periodoParaModo(m, ref);
      const result = await listarAgendamentosPeriodoAction({
        dataInicioIso: dataInicio.toISOString(),
        dataFimIso: dataFim.toISOString(),
      });
      setCarregando(false);
      if (result.serverError || !result.data) {
        setErro(
          result.serverError?.mensagem ??
            "Não foi possível carregar a agenda.",
        );
        return;
      }
      setPeriodo({
        inicio: dataInicio.toISOString(),
        fim: dataFim.toISOString(),
      });
      setAgendamentos(result.data);
    },
    [],
  );

  // Troca de aba NÃO refetch — só navega data/modo.
  async function mudarModo(proximo: AgendaModo) {
    setModo(proximo);
    await carregarPeriodo(referencia, proximo);
  }

  async function navegar(dias: number) {
    const proxima = adicionarDias(
      referencia,
      modo === "semana" ? dias * 7 : dias,
    );
    setReferencia(proxima);
    await carregarPeriodo(proxima, modo);
  }

  function trocarAba(valor: string) {
    const v = valor === "lista" ? "lista" : "quadro";
    localStorage.setItem(ABA_STORAGE_KEY, v);
    const params = new URLSearchParams(searchParams.toString());
    params.set("aba", v);
    router.replace(`/agenda?${params.toString()}`, { scroll: false });
  }

  function upsert(a: AgendamentoAgendaDTO) {
    setAgendamentos((prev) => {
      const idx = prev.findIndex((x) => x.id === a.id);
      if (idx === -1) return [...prev, a];
      const next = [...prev];
      next[idx] = a;
      return next;
    });
  }

  const tituloPeriodo = useMemo(
    () => formatarDataCompleta(referencia),
    [referencia],
  );

  async function confirmarLista(a: AgendamentoAgendaDTO) {
    const result = await confirmarConsultaAction({ agendamentoId: a.id });
    if (result.serverError || !result.data) {
      toast.error(result.serverError?.mensagem ?? "Falha ao confirmar.");
      return;
    }
    toast.success("Consulta confirmada.");
    upsert(result.data);
  }

  async function cancelarLista(a: AgendamentoAgendaDTO) {
    const result = await cancelarConsultaAction({ agendamentoId: a.id });
    if (result.serverError) {
      toast.error(result.serverError.mensagem ?? "Falha ao cancelar.");
      return;
    }
    toast.success("Consulta cancelada.");
    setAgendamentos((prev) =>
      prev.map((x) =>
        x.id === a.id ? { ...x, status: "cancelado" as const } : x,
      ),
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Agenda
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{tituloPeriodo}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {contexto.permissoes.marcar ? (
            <Button
              type="button"
              variant="primary"
              className="min-h-11"
              onClick={() => {
                setNovoDefaults(undefined);
                setNovoOpen(true);
              }}
            >
              <CalendarPlus aria-hidden />
              Nova consulta
            </Button>
          ) : null}
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="min-h-11 min-w-11"
          aria-label="Período anterior"
          onClick={() => void navegar(-1)}
        >
          <ChevronLeft />
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          onClick={() => {
            const hoje = new Date();
            setReferencia(hoje);
            void carregarPeriodo(hoje, modo);
          }}
        >
          Hoje
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="min-h-11 min-w-11"
          aria-label="Próximo período"
          onClick={() => void navegar(1)}
        >
          <ChevronRight />
        </Button>
        <div className="ml-2 flex rounded-lg border border-border p-1">
          <Button
            type="button"
            size="sm"
            variant={modo === "dia" ? "primary" : "ghost"}
            onClick={() => void mudarModo("dia")}
          >
            Dia
          </Button>
          <Button
            type="button"
            size="sm"
            variant={modo === "semana" ? "primary" : "ghost"}
            onClick={() => void mudarModo("semana")}
          >
            Semana
          </Button>
        </div>
        {carregando ? (
          <span className="text-xs text-muted-foreground">Atualizando…</span>
        ) : null}
      </div>

      {erro ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {erro}
        </p>
      ) : null}

      <Tabs value={aba} onValueChange={trocarAba}>
        <TabsList>
          <TabsTrigger value="quadro">Quadro</TabsTrigger>
          <TabsTrigger value="lista">Lista</TabsTrigger>
        </TabsList>
        <TabsContent value="quadro" className="mt-4">
          <AgendaGrid
            modo={modo}
            multiProfissional
            compacto={false}
            dataReferencia={referencia}
            agendamentos={agendamentos}
            onAgendamentosChange={setAgendamentos}
            profissionais={profissionais}
            permissoes={contexto.permissoes}
            onSlotVazio={({ profissionalId, dataHoraInicioIso }) => {
              setNovoDefaults({ profissionalId, dataHoraInicioIso });
              setNovoOpen(true);
            }}
            onAgendamentoClick={setDetalhe}
          />
        </TabsContent>
        <TabsContent value="lista" className="mt-4">
          <AgendaLista
            agendamentos={agendamentos}
            profissionais={profissionais}
            permissoes={contexto.permissoes}
            onAbrir={setDetalhe}
            onConfirmar={(a) => void confirmarLista(a)}
            onCancelar={(a) => void cancelarLista(a)}
            onRemarcar={setDetalhe}
          />
        </TabsContent>
      </Tabs>

      {/* Periodo carregado (debug a11y / teste fetch único) */}
      <p className="sr-only" data-periodo-inicio={periodo.inicio}>
        Período {periodo.inicio} – {periodo.fim}
      </p>

      <NovoAgendamentoModal
        open={novoOpen}
        onOpenChange={setNovoOpen}
        pacientes={pacientes}
        profissionais={profissionais}
        procedimentos={procedimentos}
        defaults={novoDefaults}
        onCriado={(a) => {
          upsert(a);
          setNovoDefaults(undefined);
        }}
      />

      <DetalhesAgendamentoModal
        agendamento={detalhe}
        open={detalhe != null}
        onOpenChange={(v) => {
          if (!v) setDetalhe(null);
        }}
        permissoes={contexto.permissoes}
        onAtualizado={upsert}
        onRemovido={(id) =>
          setAgendamentos((prev) =>
            prev.map((x) =>
              x.id === id ? { ...x, status: "cancelado" as const } : x,
            ),
          )
        }
      />
    </div>
  );
}
