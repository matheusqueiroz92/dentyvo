import { describe, expect, it } from "vitest";

import {
  calcularIdade,
  formatarDataNascimento,
  formatarTelefoneBr,
  mascararTelefoneInput,
  parseDataNascimentoLocal,
  pacienteCorrespondeBusca,
} from "./formatacao";
import type { PacienteDTO } from "./types";

function paciente(parcial: Partial<PacienteDTO> = {}): PacienteDTO {
  return {
    id: "p1",
    nome: "Ana Silva",
    cpf: "39053344705",
    telefone: "77999998888",
    dataNascimentoIso: "1990-05-15",
    contatoEmergencia: null,
    ...parcial,
  };
}

describe("formatacao pacientes", () => {
  it("formata telefone BR e aplica máscara de input", () => {
    expect(formatarTelefoneBr("77999998888")).toBe("(77) 99999-8888");
    expect(mascararTelefoneInput("7799999888")).toBe("(77) 9999-9888");
    expect(mascararTelefoneInput("77999998888")).toBe("(77) 99999-8888");
  });

  it("formata data de nascimento em pt-BR", () => {
    expect(formatarDataNascimento("1990-05-15")).toBe("15/05/1990");
  });

  it("calcula idade a partir da data de nascimento", () => {
    const ref = new Date(2026, 7, 3); // 03/08/2026
    expect(calcularIdade("1990-05-15", ref)).toBe(36);
    expect(calcularIdade("1990-08-10", ref)).toBe(35);
  });

  it("parseia data local sem deslocar o dia", () => {
    const d = parseDataNascimentoLocal("1990-05-15");
    expect(d.getFullYear()).toBe(1990);
    expect(d.getMonth()).toBe(4);
    expect(d.getDate()).toBe(15);
  });

  it("filtra busca por nome, CPF e telefone parciais", () => {
    const p = paciente();
    expect(pacienteCorrespondeBusca(p, "ana")).toBe(true);
    expect(pacienteCorrespondeBusca(p, "390")).toBe(true);
    expect(pacienteCorrespondeBusca(p, "99999")).toBe(true);
    expect(pacienteCorrespondeBusca(p, "xyz")).toBe(false);
  });
});
