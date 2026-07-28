import { describe, expect, it } from "vitest";

import { PAPEIS, type Papel } from "@/core/auth/domain/Papel";
import { PermissaoNegadaError } from "@/core/shared/errors";

import {
  ACOES_PACIENTE,
  assertPode,
  pode,
  type AcaoPaciente,
} from "./autorizacao";

const MATRIZ_ESPERADA: Record<AcaoPaciente, readonly Papel[]> = {
  criar_paciente: ["admin", "dentista", "recepcao"],
  buscar_paciente: ["admin", "dentista", "recepcao"],
  listar_pacientes: ["admin", "dentista", "recepcao"],
};

describe("matriz de autorização do módulo paciente", () => {
  it.each(ACOES_PACIENTE)(
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

  it("admin, dentista e recepção podem criar/buscar/listar pacientes", () => {
    for (const papel of ["admin", "dentista", "recepcao"] as const) {
      expect(pode(papel, "criar_paciente")).toBe(true);
      expect(pode(papel, "buscar_paciente")).toBe(true);
      expect(pode(papel, "listar_pacientes")).toBe(true);
    }
  });
});
