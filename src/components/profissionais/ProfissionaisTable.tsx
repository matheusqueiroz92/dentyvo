"use client";

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { MoreHorizontal, UserPlus, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { PapelBadge } from "@/components/profissionais/PapelBadge";
import { StatusConviteBadge } from "@/components/profissionais/StatusConviteBadge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import type { MembroEquipeDTO, LinhaEquipeDTO } from "@/lib/profissionais/types";

type ProfissionaisTableProps = {
  linhas: LinhaEquipeDTO[];
  carregando?: boolean;
  erro?: string | null;
  onRetry?: () => void;
  onConvidar?: () => void;
  podeGerenciar: boolean;
  onAlterarPapel: (membro: MembroEquipeDTO) => void;
  onRemover: (membro: MembroEquipeDTO) => void;
  onRevogarSessoes: (membro: MembroEquipeDTO) => void;
};

export function ProfissionaisTable({
  linhas,
  carregando = false,
  erro = null,
  onRetry,
  onConvidar,
  podeGerenciar,
  onAlterarPapel,
  onRemover,
  onRevogarSessoes,
}: ProfissionaisTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "nome", desc: false },
  ]);
  const [busca, setBusca] = useState("");

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return linhas;
    return linhas.filter(
      (l) =>
        l.nome.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        (l.cro ?? "").toLowerCase().includes(q),
    );
  }, [linhas, busca]);

  const columns = useMemo<ColumnDef<LinhaEquipeDTO>[]>(
    () => [
      {
        accessorKey: "nome",
        header: "Nome",
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.original.nome || "—"}
          </span>
        ),
      },
      {
        accessorKey: "email",
        header: "E-mail",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.email}</span>
        ),
      },
      {
        accessorKey: "papel",
        header: "Papel",
        cell: ({ row }) => <PapelBadge papel={row.original.papel} />,
      },
      {
        accessorKey: "cro",
        header: "CRO",
        cell: ({ row }) => (
          <span className="tabular-nums text-sm">
            {row.original.papel === "dentista"
              ? (row.original.cro ?? "—")
              : "—"}
          </span>
        ),
      },
      {
        id: "convite",
        header: "Convite",
        enableSorting: false,
        cell: ({ row }) =>
          row.original.conviteStatus ? (
            <StatusConviteBadge status={row.original.conviteStatus} />
          ) : (
            <span className="text-sm text-muted-foreground">Ativo</span>
          ),
      },
      {
        id: "acoes",
        header: "Ações",
        enableSorting: false,
        cell: ({ row }) => {
          if (!podeGerenciar || row.original.tipo !== "membro") {
            return <span className="sr-only">Sem ações</span>;
          }
          const membro = row.original;
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="min-h-11 min-w-11"
                    aria-label={`Ações de ${membro.nome}`}
                  >
                    <MoreHorizontal aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => onAlterarPapel(membro)}>
                    Alterar papel
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => onRevogarSessoes(membro)}
                  >
                    Desconectar de todos os dispositivos
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => onRemover(membro)}
                  >
                    Remover membro
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [podeGerenciar, onAlterarPapel, onRemover, onRevogarSessoes],
  );

  const table = useReactTable({
    data: filtradas,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (carregando) {
    return (
      <div
        className="space-y-3"
        aria-busy="true"
        aria-label="Carregando equipe"
      >
        <Skeleton className="h-10 w-full max-w-sm" />
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
          Não foi possível carregar a equipe.
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

  if (linhas.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Nenhum membro na equipe"
        description="Convide o primeiro profissional da clínica."
        action={
          podeGerenciar && onConvidar ? (
            <Button
              type="button"
              variant="primary"
              className="min-h-11"
              onClick={onConvidar}
            >
              <UserPlus aria-hidden />
              Convidar
            </Button>
          ) : null
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="min-w-[200px] max-w-md space-y-1">
        <label htmlFor="busca-equipe" className="text-xs text-muted-foreground">
          Buscar
        </label>
        <Input
          id="busca-equipe"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Nome, e-mail ou CRO"
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
                        className="inline-flex min-h-11 items-center gap-1 hover:text-foreground"
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
                  Nenhum membro encontrado para a busca.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
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
    </div>
  );
}
