import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const atualizar = vi.fn();

vi.mock("@/actions/configuracoes-clinica", () => ({
  atualizarClinicaAction: (...args: unknown[]) => atualizar(...args),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

import { EditarDadosClinicaModal } from "./EditarDadosClinicaModal";
import type { ClinicaGeralDTO } from "@/lib/configuracoes/types";

const clinica: ClinicaGeralDTO = {
  id: "cli-1",
  nome: "Clínica Um",
  endereco: "Rua A, 1",
  status: "ativa",
  documento: { tipo: "cnpj", valor: "11222333000181" },
};

describe("EditarDadosClinicaModal", () => {
  beforeEach(() => {
    atualizar.mockReset();
  });

  it("envia só o nome quando o endereço não mudou", async () => {
    const user = userEvent.setup();
    atualizar.mockResolvedValue({ data: { ...clinica, nome: "Clínica Nova" } });
    const onAtualizada = vi.fn();

    render(
      <EditarDadosClinicaModal
        open
        onOpenChange={vi.fn()}
        clinica={clinica}
        onAtualizada={onAtualizada}
      />,
    );

    const nome = screen.getByLabelText(/Nome/i);
    await user.clear(nome);
    await user.type(nome, "Clínica Nova");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(atualizar).toHaveBeenCalledWith({ nome: "Clínica Nova" });
    });
    expect(atualizar).toHaveBeenCalledTimes(1);
  });

  it("envia só o endereço quando o nome não mudou", async () => {
    const user = userEvent.setup();
    atualizar.mockResolvedValue({
      data: { ...clinica, endereco: "Av. Nova, 10" },
    });

    render(
      <EditarDadosClinicaModal
        open
        onOpenChange={vi.fn()}
        clinica={clinica}
        onAtualizada={vi.fn()}
      />,
    );

    const endereco = screen.getByLabelText(/Endereço/i);
    await user.clear(endereco);
    await user.type(endereco, "Av. Nova, 10");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(atualizar).toHaveBeenCalledWith({ endereco: "Av. Nova, 10" });
    });
  });

  it("barra os dois campos vazios sem chamar o servidor", async () => {
    const user = userEvent.setup();

    render(
      <EditarDadosClinicaModal
        open
        onOpenChange={vi.fn()}
        clinica={clinica}
        onAtualizada={vi.fn()}
      />,
    );

    await user.clear(screen.getByLabelText(/Nome/i));
    await user.clear(screen.getByLabelText(/Endereço/i));
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(
        screen.getAllByText(
          "Informe ao menos nome ou endereço para atualizar a clínica.",
        ).length,
      ).toBeGreaterThan(0);
    });
    expect(atualizar).not.toHaveBeenCalled();
  });

  it("não envia quando os valores não mudaram", async () => {
    const user = userEvent.setup();

    render(
      <EditarDadosClinicaModal
        open
        onOpenChange={vi.fn()}
        clinica={clinica}
        onAtualizada={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(
      await screen.findByText(
        "Informe ao menos nome ou endereço para atualizar a clínica.",
      ),
    ).toBeInTheDocument();
    expect(atualizar).not.toHaveBeenCalled();
  });

  it("atualiza o pai e fecha o modal após sucesso", async () => {
    const user = userEvent.setup();
    const atualizada = { ...clinica, nome: "Clínica Nova" };
    atualizar.mockResolvedValue({ data: atualizada });
    const onAtualizada = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <EditarDadosClinicaModal
        open
        onOpenChange={onOpenChange}
        clinica={clinica}
        onAtualizada={onAtualizada}
      />,
    );

    const nome = screen.getByLabelText(/Nome/i);
    await user.clear(nome);
    await user.type(nome, "Clínica Nova");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(onAtualizada).toHaveBeenCalledWith(atualizada);
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("não exibe campo de documento nem controle de edição para CPF/CNPJ", () => {
    render(
      <EditarDadosClinicaModal
        open
        onOpenChange={vi.fn()}
        clinica={clinica}
        onAtualizada={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText(/CPF|CNPJ|documento/i)).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue("11.222.333/0001-81")).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue("11222333000181")).not.toBeInTheDocument();
  });
});
