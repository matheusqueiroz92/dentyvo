import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import { PacientesTable } from "./PacientesTable";
import type { PacienteDTO } from "@/lib/pacientes/types";

const pacientes: PacienteDTO[] = [
  {
    id: "p1",
    nome: "Ana Silva",
    cpf: "39053344705",
    telefone: "77999998888",
    dataNascimentoIso: "1990-05-15",
    contatoEmergencia: null,
  },
  {
    id: "p2",
    nome: "Bruno Costa",
    cpf: "52999424725",
    telefone: "77988887777",
    dataNascimentoIso: "1985-01-20",
    contatoEmergencia: null,
  },
];

describe("PacientesTable", () => {
  it("filtra por nome parcial e CPF parcial", async () => {
    const user = userEvent.setup();
    render(<PacientesTable pacientes={pacientes} />);

    expect(screen.getByText("Ana Silva")).toBeInTheDocument();
    expect(screen.getByText("Bruno Costa")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Buscar"), "ana");
    expect(screen.getByText("Ana Silva")).toBeInTheDocument();
    expect(screen.queryByText("Bruno Costa")).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText("Buscar"));
    await user.type(screen.getByLabelText("Buscar"), "390");
    expect(screen.getByText("Ana Silva")).toBeInTheDocument();
    expect(screen.queryByText("Bruno Costa")).not.toBeInTheDocument();
  });

  it("exibe estado vazio quando não há pacientes", () => {
    render(<PacientesTable pacientes={[]} listaVaziaSemFiltro onNovo={vi.fn()} />);
    expect(
      screen.getByText("Nenhum paciente cadastrado"),
    ).toBeInTheDocument();
  });
});
