import { describe, expect, it } from "vitest";

import {
  ACOES_RECEITUARIO,
  assertPode,
  pode,
  type AcaoReceituario,
} from "./autorizacao";
import { PAPEIS, type Papel } from "@/core/auth/domain/Papel";
import { PermissaoNegadaError } from "@/core/shared/errors";

const MATRIZ_ESPERADA: Record<AcaoReceituario, readonly Papel[]> = {
  emitir_receita: ["dentista"],
  listar_receitas_prontuario: ["dentista"],
  gerar_pdf_receita: ["dentista"],
};

describe("matriz de autorização do módulo receituário", () => {
  it.each(ACOES_RECEITUARIO)(
    "concede a ação %s apenas a dentista",
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

  it("admin e recepção não emitem, listam nem geram PDF", () => {
    for (const acao of ACOES_RECEITUARIO) {
      expect(pode("admin", acao)).toBe(false);
      expect(pode("recepcao", acao)).toBe(false);
    }
  });
});
