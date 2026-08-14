import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const consultar = vi.fn();

vi.mock("@/actions/configuracoes-clinica", () => ({
  consultarClinicaAction: () => consultar(),
  atualizarClinicaAction: vi.fn(),
  atualizarTemaClinicaAction: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

import { TemaClinicaProvider } from "@/components/layout/tema-clinica-context";

import { GeralConfigTab } from "./GeralConfigTab";

const clinica = {
  id: "cli-1",
  nome: "Clínica Um",
  endereco: "Rua A, 1",
  status: "ativa" as const,
  tema: "azul-padrao" as const,
  documento: { tipo: "cnpj" as const, valor: "11222333000181" },
};

function renderGeral() {
  return render(
    <TemaClinicaProvider temaInicial="azul-padrao">
      <GeralConfigTab />
    </TemaClinicaProvider>,
  );
}

describe("GeralConfigTab", () => {
  beforeEach(() => {
    consultar.mockReset();
  });

  it("exibe nome, endereço, documento somente leitura e status", async () => {
    consultar.mockResolvedValue({
      data: { papel: "admin", clinica },
    });

    renderGeral();

    expect(
      await screen.findByText("Clínica Um"),
    ).toBeInTheDocument();
    expect(screen.getByText("Rua A, 1")).toBeInTheDocument();
    expect(screen.getByText("11.222.333/0001-81")).toBeInTheDocument();
    expect(screen.getByText("Ativa")).toBeInTheDocument();
    expect(screen.getByText(/Documento fiscal imutável/i)).toBeInTheDocument();

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
  });

  it("exibe CPF formatado quando o documento da clínica é CPF", async () => {
    consultar.mockResolvedValue({
      data: {
        papel: "admin",
        clinica: {
          ...clinica,
          documento: { tipo: "cpf", valor: "39053344705" },
        },
      },
    });

    renderGeral();

    expect(await screen.findByText("390.533.447-05")).toBeInTheDocument();
    expect(screen.getByText("CPF")).toBeInTheDocument();
  });

  it("abre o modal de edição sem campo de documento", async () => {
    consultar.mockResolvedValue({
      data: { papel: "admin", clinica },
    });
    const user = userEvent.setup();

    renderGeral();
    await screen.findByText("Clínica Um");
    await user.click(screen.getByRole("button", { name: "Editar" }));

    expect(
      screen.getByRole("heading", { name: "Editar dados da clínica" }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/CPF|CNPJ|documento/i)).not.toBeInTheDocument();
  });

  it("oculta a edição quando o papel não é admin", async () => {
    consultar.mockResolvedValue({
      data: { papel: "dentista", clinica },
    });

    renderGeral();

    expect(
      await screen.findByText(
        /Apenas administradores podem ver e editar os dados cadastrais da clínica/,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Tema visual" }),
    ).not.toBeInTheDocument();
  });

  it("exibe o seletor de tema para admin, com o tema atual destacado", async () => {
    consultar.mockResolvedValue({
      data: {
        papel: "admin",
        clinica: { ...clinica, tema: "verde" },
      },
    });

    render(
      <TemaClinicaProvider temaInicial="verde">
        <GeralConfigTab />
      </TemaClinicaProvider>,
    );

    expect(
      await screen.findByRole("heading", { name: "Tema visual" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Verde/i })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(
      screen.queryByRole("dialog"),
    ).not.toBeInTheDocument();
  });

  it("exibe erro quando a consulta falha", async () => {
    consultar.mockResolvedValue({
      serverError: { mensagem: "Sessão expirada. Faça login novamente." },
    });

    renderGeral();

    await waitFor(() => {
      expect(
        screen.getByText("Sessão expirada. Faça login novamente."),
      ).toBeInTheDocument();
    });
  });
});
