import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LIMITE_HISTORICO_COBRANCA_PAINEL } from "@/core/assinatura/domain/constants";
import type { ItemHistoricoCobrancaDTO } from "@/lib/configuracoes/assinatura-types";

import { HistoricoCobrancaTable } from "./HistoricoCobrancaTable";

function item(
  parcial: Partial<ItemHistoricoCobrancaDTO> & { id: string; vencimentoIso: string },
): ItemHistoricoCobrancaDTO {
  return {
    valor: 59.9,
    metodo: "pix",
    status: "paga",
    pagaEmIso: null,
    ...parcial,
  };
}

describe("HistoricoCobrancaTable", () => {
  it("exibe estado vazio quando não há cobranças", () => {
    render(<HistoricoCobrancaTable itens={[]} />);
    expect(
      screen.getByText("Nenhuma cobrança registrada."),
    ).toBeInTheDocument();
  });

  it("lista vencimento, valor, status e método com rótulos amigáveis", () => {
    render(
      <HistoricoCobrancaTable
        itens={[
          item({
            id: "c1",
            vencimentoIso: "2026-08-15T12:00:00.000Z",
            valor: 99.9,
            metodo: "boleto",
            status: "vencida",
          }),
        ]}
      />,
    );

    expect(screen.getByRole("columnheader", { name: "Vencimento" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Valor" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Status" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Método" })).toBeInTheDocument();
    expect(screen.getByText("Vencida")).toBeInTheDocument();
    expect(screen.getByText("Boleto")).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*99,90/)).toBeInTheDocument();
    expect(screen.queryByText("vencida")).not.toBeInTheDocument();
    expect(screen.queryByText("boleto")).not.toBeInTheDocument();
  });

  it("não mostra mais de 12 itens mesmo que existam mais", () => {
    const itens = Array.from({ length: 15 }, (_, i) => {
      const dia = String(i + 1).padStart(2, "0");
      return item({
        id: `c-${dia}`,
        vencimentoIso: `2026-01-${dia}T12:00:00.000Z`,
      });
    });

    render(<HistoricoCobrancaTable itens={itens} />);

    expect(screen.getAllByRole("row")).toHaveLength(
      LIMITE_HISTORICO_COBRANCA_PAINEL + 1,
    );
  });

  it("mantém a ordem recebida (vencimento mais recente primeiro)", () => {
    render(
      <HistoricoCobrancaTable
        itens={[
          item({ id: "recente", vencimentoIso: "2026-08-10T12:00:00.000Z" }),
          item({ id: "antiga", vencimentoIso: "2026-01-10T12:00:00.000Z" }),
        ]}
      />,
    );

    const celulasData = screen.getAllByRole("cell").filter((_, i) => i % 4 === 0);
    const textos = celulasData.map((c) => c.textContent ?? "");
    expect(textos[0]).toMatch(/10\/08\/2026/);
    expect(textos[1]).toMatch(/10\/01\/2026/);
  });
});
