import { describe, expect, it } from "vitest";

import { PAPEIS, type Papel } from "@/core/auth/domain/Papel";
import { PermissaoNegadaError } from "@/core/shared/errors";

import {
  ACOES_ATESTADO,
  assertPode,
  pode,
  type AcaoAtestado,
} from "./autorizacao";

const MATRIZ_ESPERADA: Record<AcaoAtestado, readonly Papel[]> = {
  emitir_atestado: ["dentista"],
  listar_atestados_prontuario: ["dentista"],
  gerar_pdf_atestado: ["dentista"],
};

describe("matriz de autorização do módulo atestado", () => {
  it.each(ACOES_ATESTADO)(
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

  it("admin da clínica e recepção não emitem, listam nem geram PDF", () => {
    for (const acao of ACOES_ATESTADO) {
      expect(pode("admin", acao)).toBe(false);
      expect(pode("recepcao", acao)).toBe(false);
    }
  });
});
