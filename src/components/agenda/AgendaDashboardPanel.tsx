"use client";

import { CalendarPlus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  AgendaPermissoes,
  AgendamentoAgendaDTO,
  OpcaoSelect,
} from "@/lib/agenda/types";

import { AgendaGrid } from "./AgendaGrid";
import { DetalhesAgendamentoModal } from "./DetalhesAgendamentoModal";
import { NovoAgendamentoModal } from "./NovoAgendamentoModal";

type AgendaDashboardPanelProps = {
  iniciais: AgendamentoAgendaDTO[];
  profissionais: OpcaoSelect[];
  pacientes: OpcaoSelect[];
  procedimentos: OpcaoSelect[];
  permissoes: AgendaPermissoes;
  profissionalIdSessao: string;
};

/**
 * Agenda compacta do dashboard: só hoje, DnD ativo, sem abas/navegação.
 */
export function AgendaDashboardPanel({
  iniciais,
  profissionais,
  pacientes,
  procedimentos,
  permissoes,
  profissionalIdSessao,
}: AgendaDashboardPanelProps) {
  const [agendamentos, setAgendamentos] =
    useState<AgendamentoAgendaDTO[]>(iniciais);
  const [filtroProf, setFiltroProf] = useState<string>("todos");
  const [novoOpen, setNovoOpen] = useState(false);
  const [novoDefaults, setNovoDefaults] = useState<
    { profissionalId?: string; dataHoraInicioIso?: string } | undefined
  >();
  const [detalhe, setDetalhe] = useState<AgendamentoAgendaDTO | null>(null);
  const hoje = new Date();

  function upsert(a: AgendamentoAgendaDTO) {
    setAgendamentos((prev) => {
      const idx = prev.findIndex((x) => x.id === a.id);
      if (idx === -1) return [...prev, a];
      const next = [...prev];
      next[idx] = a;
      return next;
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-lg">Agenda do dia</CardTitle>
          <CardDescription>
            Visão compacta de hoje com remarcação por arrastar.
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className="flex h-10 min-w-[160px] rounded-md border border-border bg-background px-3 text-sm"
            value={filtroProf}
            onChange={(e) => setFiltroProf(e.target.value)}
            aria-label="Filtrar profissional"
          >
            <option value="todos">Todos juntos</option>
            {profissionais.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          {permissoes.marcar ? (
            <Button
              type="button"
              variant="primary"
              className="min-h-11"
              onClick={() => {
                setNovoDefaults({
                  profissionalId: profissionalIdSessao || profissionais[0]?.id,
                });
                setNovoOpen(true);
              }}
            >
              <CalendarPlus aria-hidden />
              Nova consulta
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        <AgendaGrid
          modo="dia"
          multiProfissional={false}
          compacto
          dataReferencia={hoje}
          agendamentos={agendamentos}
          onAgendamentosChange={setAgendamentos}
          profissionais={profissionais}
          profissionalFiltroId={
            filtroProf === "todos" ? "todos" : filtroProf
          }
          permissoes={permissoes}
          onSlotVazio={({ profissionalId, dataHoraInicioIso }) => {
            setNovoDefaults({ profissionalId, dataHoraInicioIso });
            setNovoOpen(true);
          }}
          onAgendamentoClick={setDetalhe}
        />
      </CardContent>

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
        permissoes={permissoes}
        onAtualizado={upsert}
        onRemovido={(id) =>
          setAgendamentos((prev) =>
            prev.map((x) =>
              x.id === id ? { ...x, status: "cancelado" as const } : x,
            ),
          )
        }
      />
    </Card>
  );
}
