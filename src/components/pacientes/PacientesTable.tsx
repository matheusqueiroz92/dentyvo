"use client";

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { Eye, EyeOff, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatarCpfCompleto,
  formatarCpfMascarado,
} from "@/lib/pacientes/cpf";
import {
  formatarDataNascimento,
  formatarTelefoneBr,
  pacienteCorrespondeBusca,
} from "@/lib/pacientes/formatacao";
import type { PacienteDTO } from "@/lib/pacientes/types";

function caminhoPadraoDoPaciente(id: string) {
  return `/pacientes/${id}`;
}

type PacientesTableProps = {
  pacientes: PacienteDTO[];
  carregando?: boolean;
  erro?: string | null;
  onRetry?: () => void;
  onNovo?: () => void;
  listaVaziaSemFiltro?: boolean;
  caminhoDoPaciente?: (id: string) => string;
  rotuloAcao?: string;
};

export function PacientesTable({
  pacientes,
  carregando = false,
  erro = null,
  onRetry,
  onNovo,
  listaVaziaSemFiltro = false,
  caminhoDoPaciente = caminhoPadraoDoPaciente,
  rotuloAcao = "Abrir",
}: PacientesTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([
    { id: "nome", desc: false },
  ]);
  const [busca, setBusca] = useState("");
  const [cpfRevelados, setCpfRevelados] = useState<Set<string>>(new Set());

  const filtrados = useMemo(
    () => pacientes.filter((p) => pacienteCorrespondeBusca(p, busca)),
    [pacientes, busca],
  );

  const columns = useMemo<ColumnDef<PacienteDTO>[]>(
    () => [
      {
        accessorKey: "nome",
        header: "Nome",
        cell: ({ row }) => (
          <span className="font-medium text-foreground">{row.original.nome}</span>
        ),
      },
      {
        id: "cpf",
        accessorKey: "cpf",
        header: "CPF",
        cell: ({ row }) => {
          const id = row.original.id;
          const revelado = cpfRevelados.has(id);
          return (
            <div className="flex items-center gap-1.5 tabular-nums">
              <span>
                {revelado
                  ? formatarCpfCompleto(row.original.cpf)
                  : formatarCpfMascarado(row.original.cpf)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="min-h-11 min-w-11 sm:min-h-8 sm:min-w-8"
                aria-label={
                  revelado ? "Ocultar CPF" : "Revelar CPF completo"
                }
                onClick={(e) => {
                  e.stopPropagation();
                  setCpfRevelados((prev) => {
                    const next = new Set(prev);
                    if (next.has(id)) next.delete(id);
                    else next.add(id);
                    return next;
                  });
                }}
              >
                {revelado ? (
                  <EyeOff aria-hidden />
                ) : (
                  <Eye aria-hidden />
                )}
              </Button>
            </div>
          );
        },
      },
      {
        accessorKey: "telefone",
        header: "Telefone",
        cell: ({ row }) => (
          <span className="tabular-nums">
            {formatarTelefoneBr(row.original.telefone)}
          </span>
        ),
      },
      {
        id: "dataNascimento",
        accessorFn: (r) => r.dataNascimentoIso,
        header: "Nascimento",
        cell: ({ row }) => (
          <span className="tabular-nums">
            {formatarDataNascimento(row.original.dataNascimentoIso)}
          </span>
        ),
      },
      {
        id: "acoes",
        header: "Ações",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                router.push(caminhoDoPaciente(row.original.id));
              }}
            >
              {rotuloAcao}
            </Button>
          </div>
        ),
      },
    ],
    [caminhoDoPaciente, cpfRevelados, rotuloAcao, router],
  );

  const table = useReactTable({
    data: filtrados,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  if (carregando) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Carregando pacientes">
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (erro) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-destructive/35 bg-destructive/5 px-4 py-6 text-center"
      >
        <p className="text-sm font-medium text-foreground">
          Não foi possível carregar os pacientes.
        </p>
        <p className="mt-1 text-[13px] text-muted-foreground">{erro}</p>
        {onRetry ? (
          <Button
            type="button"
            variant="outline"
            className="mt-4 min-h-11"
            onClick={onRetry}
          >
            Tentar novamente
          </Button>
        ) : null}
      </div>
    );
  }

  if (listaVaziaSemFiltro && pacientes.length === 0) {
    return (
      <EmptyState
        icon={UsersRound}
        title="Nenhum paciente cadastrado"
        description="Nenhum paciente cadastrado. Adicione o primeiro paciente."
        action={
          onNovo ? (
            <Button type="button" variant="primary" className="min-h-11" onClick={onNovo}>
              Novo paciente
            </Button>
          ) : null
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="min-w-[200px] max-w-md space-y-1">
        <label htmlFor="busca-pacientes" className="text-xs text-muted-foreground">
          Buscar
        </label>
        <Input
          id="busca-pacientes"
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            table.setPageIndex(0);
          }}
          placeholder="Nome, CPF ou telefone"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead
                    key={h.id}
                    className={h.id === "acoes" ? "text-right" : undefined}
                  >
                    {h.isPlaceholder ? null : h.column.getCanSort() ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 hover:text-foreground"
                        onClick={h.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          h.column.columnDef.header,
                          h.getContext(),
                        )}
                        {{
                          asc: " ↑",
                          desc: " ↓",
                        }[h.column.getIsSorted() as string] ?? null}
                      </button>
                    ) : (
                      flexRender(h.column.columnDef.header, h.getContext())
                    )}
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
                  Nenhum paciente encontrado para a busca.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => router.push(caminhoDoPaciente(row.original.id))}
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
        <p className="text-xs text-muted-foreground tabular-nums">
          {filtrados.length} registro(s)
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11 sm:min-h-8"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            Anterior
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11 sm:min-h-8"
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
