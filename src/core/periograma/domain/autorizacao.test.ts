import { describe, expect, it } from "vitest";

import { PAPEIS, type Papel } from "@/core/auth/domain/Papel";
import { PermissaoNegadaError } from "@/core/shared/errors";

import {
  ACOES_PERIOGRAMA,
  assertPode,
  pode,
  type AcaoPeriograma,
} from "./autorizacao";

const MATRIZ_ESPERADA: Record<AcaoPeriograma, readonly Papel[]> = {
  registrar_periograma: ["admin", "dentista"],
  consultar_periograma: ["admin", "dentista"],
  listar_periogramas_prontuario: ["admin", "dentista"],
};

describe("matriz de autorização do módulo periograma", () => {
  it.each(ACOES_PERIOGRAMA)(
    "concede a ação %s apenas a admin e dentista (padrão 003)",
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

  it("recepção não acessa nenhuma ação do periograma", () => {
    for (const acao of ACOES_PERIOGRAMA) {
      expect(pode("recepcao", acao)).toBe(false);
    }
  });
});
