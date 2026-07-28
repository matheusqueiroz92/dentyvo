import { describe, expect, it } from "vitest";

import { PAPEIS, type Papel } from "@/core/auth/domain/Papel";
import { PermissaoNegadaError } from "@/core/shared/errors";

import {
  ACOES_ANAMNESE,
  assertPode,
  pode,
  type AcaoAnamnese,
} from "./autorizacao";

const MATRIZ_ESPERADA: Record<AcaoAnamnese, readonly Papel[]> = {
  escrever_anamnese: ["admin", "dentista"],
  listar_versoes_anamnese: ["admin", "dentista"],
  obter_versao_vigente_anamnese: ["admin", "dentista"],
};

describe("matriz de autorização do módulo anamnese", () => {
  it.each(ACOES_ANAMNESE)(
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

  it("recepção não acessa anamnese clínica", () => {
    for (const acao of ACOES_ANAMNESE) {
      expect(pode("recepcao", acao)).toBe(false);
    }
  });
});
