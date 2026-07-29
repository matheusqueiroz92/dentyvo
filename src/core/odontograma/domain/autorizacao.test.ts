import { describe, expect, it } from "vitest";

import { PAPEIS, type Papel } from "@/core/auth/domain/Papel";
import { PermissaoNegadaError } from "@/core/shared/errors";

import {
  ACOES_ODONTOGRAMA,
  assertPode,
  pode,
  type AcaoOdontograma,
} from "./autorizacao";

const MATRIZ_ESPERADA: Record<AcaoOdontograma, readonly Papel[]> = {
  registrar_eventos_odontograma: ["admin", "dentista"],
  consultar_odontograma_vigente: ["admin", "dentista"],
  listar_historico_odontograma: ["admin", "dentista"],
};

describe("matriz de autorização do módulo odontograma", () => {
  it.each(ACOES_ODONTOGRAMA)(
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

  it("recepção não acessa nenhuma ação do odontograma", () => {
    for (const acao of ACOES_ODONTOGRAMA) {
      expect(pode("recepcao", acao)).toBe(false);
    }
  });
});
