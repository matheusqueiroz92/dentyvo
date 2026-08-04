import { describe, expect, it } from "vitest";

import { PAPEIS, type Papel } from "@/core/auth/domain/Papel";
import { PermissaoNegadaError } from "@/core/shared/errors";

import {
  ACOES_AGENDAMENTO,
  assertPode,
  pode,
  type AcaoAgendamento,
} from "./autorizacao";

const MATRIZ_ESPERADA: Record<AcaoAgendamento, readonly Papel[]> = {
  definir_disponibilidade: ["admin", "dentista"],
  listar_horarios_disponiveis: ["admin", "dentista", "recepcao"],
  listar_agendamentos_do_periodo: ["admin", "dentista", "recepcao"],
  marcar_consulta: ["admin", "dentista", "recepcao"],
  remarcar_consulta: ["admin", "dentista", "recepcao"],
  cancelar_consulta: ["admin", "dentista", "recepcao"],
  confirmar_consulta: ["admin", "dentista", "recepcao"],
  criar_procedimento: ["admin", "dentista", "recepcao"],
  buscar_procedimento: ["admin", "dentista", "recepcao"],
  listar_procedimentos: ["admin", "dentista", "recepcao"],
  configurar_menu_publico_procedimentos: ["admin"],
};

describe("matriz de autorização do módulo agendamento", () => {
  it.each(ACOES_AGENDAMENTO)(
    "concede a ação %s apenas aos papéis permitidos",
    (acao) => {
      for (const papel of PAPEIS) {
        const permitido = MATRIZ_ESPERADA[acao].includes(papel);
        expect(pode(papel, acao)).toBe(permitido);

        if (permitido) {
          expect(() => assertPode(papel, acao)).not.toThrow();
        } else {
          expect(() => assertPode(papel, acao)).toThrow(PermissaoNegadaError);
        }
      }
    },
  );

  it("recepção não pode definir disponibilidade", () => {
    expect(pode("recepcao", "definir_disponibilidade")).toBe(false);
    expect(() => assertPode("recepcao", "definir_disponibilidade")).toThrow(
      PermissaoNegadaError,
    );
  });

  it("admin e dentista podem definir disponibilidade", () => {
    expect(pode("admin", "definir_disponibilidade")).toBe(true);
    expect(pode("dentista", "definir_disponibilidade")).toBe(true);
  });

  it("admin, dentista e recepção podem marcar/remarcar/cancelar/confirmar", () => {
    for (const papel of ["admin", "dentista", "recepcao"] as const) {
      expect(pode(papel, "marcar_consulta")).toBe(true);
      expect(pode(papel, "remarcar_consulta")).toBe(true);
      expect(pode(papel, "cancelar_consulta")).toBe(true);
      expect(pode(papel, "confirmar_consulta")).toBe(true);
    }
  });
});
