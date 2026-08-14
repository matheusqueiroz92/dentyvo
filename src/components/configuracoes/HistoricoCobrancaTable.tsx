"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Receipt } from "lucide-react";
import { useMemo } from "react";

import { StatusCobrancaBadge } from "@/components/configuracoes/StatusCobrancaBadge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LIMITE_HISTORICO_COBRANCA_PAINEL } from "@/core/assinatura/domain/constants";
import type { ItemHistoricoCobrancaDTO } from "@/lib/configuracoes/assinatura-types";
import { formatarDataPainel } from "@/lib/configuracoes/formatar-data-painel";
import { rotuloMetodoPagamento } from "@/lib/configuracoes/rotulos-assinatura";
import { formatBRL } from "@/lib/design-tokens";

type HistoricoCobrancaTableProps = {
  itens: ItemHistoricoCobrancaDTO[];
};

export function HistoricoCobrancaTable({ itens }: HistoricoCobrancaTableProps) {
  const visiveis = useMemo(
    () => itens.slice(0, LIMITE_HISTORICO_COBRANCA_PAINEL),
    [itens],
  );

  const columns = useMemo<ColumnDef<ItemHistoricoCobrancaDTO>[]>(
    () => [
      {
        accessorKey: "vencimentoIso",
        header: "Vencimento",
        cell: ({ row }) => (
          <span className="tabular-nums">
            {formatarDataPainel(row.original.vencimentoIso)}
          </span>
        ),
      },
      {
        accessorKey: "valor",
        header: "Valor",
        cell: ({ row }) => (
          <span className="tabular-nums">{formatBRL(row.original.valor)}</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusCobrancaBadge status={row.original.status} />,
      },
      {
        accessorKey: "metodo",
        header: "Método",
        cell: ({ row }) => rotuloMetodoPagamento(row.original.metodo),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: visiveis,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (visiveis.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="Nenhuma cobrança registrada."
        description="Cobranças da assinatura aparecem aqui quando forem geradas."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((group) => (
          <TableRow key={group.id}>
            {group.headers.map((header) => (
              <TableHead key={header.id}>
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
