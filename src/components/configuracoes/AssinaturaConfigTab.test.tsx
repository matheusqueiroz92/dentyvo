import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DetalhesAssinaturaDTO } from "@/lib/configuracoes/assinatura-types";

const consultar = vi.fn();

vi.mock("@/actions/configuracoes-assinatura", () => ({
  obterDetalhesAssinaturaAction: () => consultar(),
}));

import { AssinaturaConfigTab } from "./AssinaturaConfigTab";

function detalhes(
  parcial: Partial<DetalhesAssinaturaDTO> = {},
): DetalhesAssinaturaDTO {
  return {
    plano: { nome: "Básico", valorMensal: 99.9 },
    status: "ativa",
    dataProximaCobrancaIso: "2026-09-01T12:00:00.000Z",
    historicoCobranca: [],
    precoPromocionalAteIso: null,
    migradaParaPrecoCheioEmIso: null,
    valorEfetivoCentavos: 9990,
    origemValor: "cheio",
    vagaPromocional: null,
    linkRegularizacao: null,
    ...parcial,
  };
}

describe("AssinaturaConfigTab", () => {
  beforeEach(() => {
    consultar.mockReset();
  });

  it("em trial mostra Período de trial e não o card de preço", async () => {
    consultar.mockResolvedValue({
      data: {
        papel: "admin",
        detalhes: detalhes({
          plano: null,
          status: "trialing",
          valorEfetivoCentavos: null,
          origemValor: null,
        }),
      },
    });

    render(<AssinaturaConfigTab />);

    expect(await screen.findByText("Período de trial")).toBeInTheDocument();
    expect(screen.getByText("Trial")).toBeInTheDocument();
    expect(screen.queryByText(/Preço promocional válido até/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Valor vigente/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/R\$\s*99,90/)).not.toBeInTheDocument();
  });

  it("mostra promoção vigente até a data, com valor efetivo em destaque", async () => {
    consultar.mockResolvedValue({
      data: {
        papel: "admin",
        detalhes: detalhes({
          precoPromocionalAteIso: "2027-08-01T12:00:00.000Z",
          migradaParaPrecoCheioEmIso: null,
          valorEfetivoCentavos: 5900,
          origemValor: "promocional",
          vagaPromocional: { posicao: 7 },
        }),
      },
    });

    render(<AssinaturaConfigTab />);

    expect(
      await screen.findByText(/Preço promocional válido até/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*59,00/)).toBeInTheDocument();
    expect(
      screen.getByText(/Você é a clínica nº 7 das 30 primeiras da Dentyvo/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/A promoção encerrou/i)).not.toBeInTheDocument();
  });

  it("mostra promoção encerrada no preço cheio e não a mensagem de válido até", async () => {
    consultar.mockResolvedValue({
      data: {
        papel: "admin",
        detalhes: detalhes({
          precoPromocionalAteIso: "2026-08-01T12:00:00.000Z",
          migradaParaPrecoCheioEmIso: "2026-08-02T12:00:00.000Z",
          valorEfetivoCentavos: 5900,
          origemValor: "promocional",
          vagaPromocional: { posicao: 3 },
        }),
      },
    });

    render(<AssinaturaConfigTab />);

    expect(await screen.findByText(/A promoção encerrou em/i)).toBeInTheDocument();
    expect(screen.getByText(/preço cheio do plano/i)).toBeInTheDocument();
    expect(screen.queryByText(/Preço promocional válido até/i)).not.toBeInTheDocument();
    expect(screen.getByText(/R\$\s*99,90/)).toBeInTheDocument();
    expect(screen.queryByText(/R\$\s*59,00/)).not.toBeInTheDocument();
  });

  it("exibe banner de regularização com CTA quando há link", async () => {
    consultar.mockResolvedValue({
      data: {
        papel: "admin",
        detalhes: detalhes({
          status: "inadimplente",
          linkRegularizacao: "https://pagar.exemplo/pix",
        }),
      },
    });

    render(<AssinaturaConfigTab />);

    expect(await screen.findByText("Pagamento em aberto")).toBeInTheDocument();
    const cta = screen.getByRole("link", { name: "Regularizar pagamento" });
    expect(cta).toHaveAttribute("href", "https://pagar.exemplo/pix");
  });

  it("mostra orientação de suporte quando não há assinatura", async () => {
    consultar.mockResolvedValue({
      serverError: {
        codigo: "AssinaturaNaoEncontradaError",
        mensagem: "Assinatura não encontrada para esta clínica.",
      },
    });

    render(<AssinaturaConfigTab />);

    expect(
      await screen.findByText("Assinatura não encontrada"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/contato com o suporte da Dentyvo/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Não foi possível carregar a assinatura"),
    ).not.toBeInTheDocument();
  });

  it("oculta o conteúdo quando o papel não é admin", async () => {
    consultar.mockResolvedValue({
      data: { papel: "dentista", detalhes: detalhes() },
    });

    render(<AssinaturaConfigTab />);

    expect(
      await screen.findByText(
        /Apenas administradores podem ver os dados da assinatura/,
      ),
    ).toBeInTheDocument();
  });

  it("exibe erro genérico quando a consulta falha por outro motivo", async () => {
    consultar.mockResolvedValue({
      serverError: { codigo: "ErroInesperado", mensagem: "Falha de rede." },
    });

    render(<AssinaturaConfigTab />);

    await waitFor(() => {
      expect(
        screen.getByText("Não foi possível carregar a assinatura"),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Falha de rede.")).toBeInTheDocument();
  });
});
