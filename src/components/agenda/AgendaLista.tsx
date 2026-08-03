"use client";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";

import { StatusAgendamentoBadge } from "@/components/domain/StatusAgendamentoBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatarHora } from "@/lib/agenda/periodo";
import type {
  AgendaPermissoes,
  AgendamentoAgendaDTO,
  OpcaoSelect,
} from "@/lib/agenda/types";
import type { StatusAgendamento } from "@/core/agendamento/domain/StatusAgendamento";
import { STATUS_AGENDAMENTO } from "@/core/agendamento/domain/StatusAgendamento";

type AgendaListaProps = {
  agendamentos: AgendamentoAgendaDTO[];
  profissionais: OpcaoSelect[];
  permissoes: AgendaPermissoes;
  onAbrir: (a: AgendamentoAgendaDTO) => void;
  onConfirmar: (a: AgendamentoAgendaDTO) => void;
  onCancelar: (a: AgendamentoAgendaDTO) => void;
  onRemarcar: (a: AgendamentoAgendaDTO) => void;
};

export function AgendaLista({
  agendamentos,
  profissionais,
  permissoes,
  onAbrir,
  onConfirmar,
  onCancelar,
  onRemarcar,
}: AgendaListaProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "horario", desc: false },
  ]);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<StatusAgendamento | "todos">(
    "todos",
  );
  const [filtroProf, setFiltroProf] = useState<string>("todos");

  const filtrados = useMemo(() => {
    return agendamentos.filter((a) => {
      if (filtroStatus !== "todos" && a.status !== filtroStatus) return false;
      if (filtroProf !== "todos" && a.profissionalId !== filtroProf)
        return false;
      if (
        busca.trim() &&
        !a.pacienteNome.toLowerCase().includes(busca.trim().toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [agendamentos, busca, filtroStatus, filtroProf]);

  const columns = useMemo<ColumnDef<AgendamentoAgendaDTO>[]>(
    () => [
      {
        id: "horario",
        accessorFn: (r) => r.dataHoraInicioIso,
        header: "Horário",
        cell: ({ row }) => (
          <span className="tabular-nums">
            {formatarHora(row.original.dataHoraInicioIso)}
          </span>
        ),
      },
      {
        accessorKey: "pacienteNome",
        header: "Paciente",
      },
      {
        accessorKey: "profissionalNome",
        header: "Profissional",
      },
      {
        accessorKey: "procedimentoNome",
        header: "Procedimento",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <StatusAgendamentoBadge status={row.original.status} />
        ),
      },
      {
        id: "acoes",
        header: "Ações",
        cell: ({ row }) => {
          const a = row.original;
          const ativo =
            a.status === "pendente" || a.status === "confirmado";
          return (
            <div className="flex flex-wrap justify-end gap-1">
              {permissoes.confirmar && a.status === "pendente" ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onConfirmar(a);
                  }}
                >
                  Confirmar
                </Button>
              ) : null}
              {permissoes.remarcar && ativo ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemarcar(a);
                  }}
                >
                  Remarcar
                </Button>
              ) : null}
              {permissoes.cancelar && ativo ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancelar(a);
                  }}
                >
                  Cancelar
                </Button>
              ) : null}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onAbrir(a);
                }}
              >
                Detalhes
              </Button>
            </div>
          );
        },
      },
    ],
    [permissoes, onAbrir, onCancelar, onConfirmar, onRemarcar],
  );

  const table = useReactTable({
    data: filtrados,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-[200px] flex-1 space-y-1">
          <label htmlFor="busca-paciente" className="text-xs text-muted-foreground">
            Buscar paciente
          </label>
          <Input
            id="busca-paciente"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Nome do paciente"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="filtro-status" className="text-xs text-muted-foreground">
            Status
          </label>
          <select
            id="filtro-status"
            className="flex h-10 rounded-md border border-border bg-background px-3 text-sm"
            value={filtroStatus}
            onChange={(e) =>
              setFiltroStatus(e.target.value as StatusAgendamento | "todos")
            }
          >
            <option value="todos">Todos</option>
            {STATUS_AGENDAMENTO.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="filtro-prof" className="text-xs text-muted-foreground">
            Profissional
          </label>
          <select
            id="filtro-prof"
            className="flex h-10 rounded-md border border-border bg-background px-3 text-sm"
            value={filtroProf}
            onChange={(e) => setFiltroProf(e.target.value)}
          >
            <option value="todos">Todos</option>
            {profissionais.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead
                    key={h.id}
                    className={h.id === "acoes" ? "text-right" : undefined}
                  >
                    {h.isPlaceholder
                      ? null
                      : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  Nenhum agendamento encontrado.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => onAbrir(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={
                        cell.column.id === "acoes" ? "text-right" : undefined
                      }
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {filtrados.length} registro(s)
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            Anterior
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
}
