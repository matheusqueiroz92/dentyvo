import { describe, expect, it } from "vitest";

import { PAPEIS, type Papel } from "@/core/auth/domain/Papel";
import { PermissaoNegadaError } from "@/core/shared/errors";

import {
  ACOES_PRONTUARIO,
  assertPode,
  pode,
  type AcaoProntuario,
} from "./autorizacao";

const MATRIZ_ESPERADA: Record<AcaoProntuario, readonly Papel[]> = {
  consultar_prontuario: ["admin", "dentista"],
  criar_prontuario: ["admin", "dentista"],
  registrar_evolucao: ["admin", "dentista"],
  retificar_evolucao: ["admin", "dentista"],
  obter_evolucoes: ["admin", "dentista"],
};

describe("matriz de autorização do módulo prontuário", () => {
  it.each(ACOES_PRONTUARIO)(
    "concede a ação %s apenas a admin e dentista",
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

  it("recepção não acessa nenhuma ação clínica do prontuário", () => {
    for (const acao of ACOES_PRONTUARIO) {
      expect(pode("recepcao", acao)).toBe(false);
    }
  });
});
