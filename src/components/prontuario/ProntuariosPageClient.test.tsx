import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

import type { PacienteDTO } from "@/lib/pacientes/types";

import { ProntuariosPageClient } from "./ProntuariosPageClient";

const pacientes: PacienteDTO[] = [
  {
    id: "p1",
    nome: "Ana Silva",
    cpf: "39053344705",
    telefone: "77999998888",
    dataNascimentoIso: "1990-05-15",
    contatoEmergencia: null,
  },
];

describe("ProntuariosPageClient", () => {
  it("lista pacientes para abrir o prontuário clínico", () => {
    render(<ProntuariosPageClient iniciais={pacientes} />);

    expect(
      screen.getByRole("heading", { name: "Prontuários" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Ana Silva")).toBeInTheDocument();
    expect(screen.queryByText("Em construção")).not.toBeInTheDocument();
  });

  it("navega para o paciente já na aba Prontuário", async () => {
    const user = userEvent.setup();
    render(<ProntuariosPageClient iniciais={pacientes} />);

    await user.click(screen.getByRole("button", { name: "Abrir prontuário" }));
    expect(push).toHaveBeenCalledWith("/pacientes/p1?aba=prontuario");
  });

  it("mostra estado vazio quando não há pacientes", () => {
    render(<ProntuariosPageClient iniciais={[]} />);

    expect(
      screen.getByText("Nenhum paciente cadastrado"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Ir para pacientes" }),
    ).toHaveAttribute("href", "/pacientes");
  });
});
