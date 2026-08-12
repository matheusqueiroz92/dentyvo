import { describe, expect, it } from "vitest";

import { PAPEIS, type Papel } from "@/core/auth/domain/Papel";
import { PermissaoNegadaError } from "@/core/shared/errors";

import {
  ACOES_ORCAMENTO,
  assertPode,
  pode,
  type AcaoOrcamento,
} from "./autorizacao";

/** Matriz comercial (spec 015) — distinta de Receita/Atestado (só dentista). */
const PAPEIS_COMERCIAIS = ["admin", "dentista", "recepcao"] as const;

const MATRIZ_ESPERADA: Record<AcaoOrcamento, readonly Papel[]> = {
  emitir_orcamento: PAPEIS_COMERCIAIS,
  listar_orcamentos_prontuario: PAPEIS_COMERCIAIS,
  aceitar_orcamento: PAPEIS_COMERCIAIS,
  recusar_orcamento: PAPEIS_COMERCIAIS,
  gerar_pdf_orcamento: PAPEIS_COMERCIAIS,
};

describe("matriz de autorização do módulo orçamento", () => {
  it.each(ACOES_ORCAMENTO)(
    "concede a ação %s a admin, dentista e recepção",
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

  it("recepção NÃO é negada em nenhuma ação de orçamento (diferente de Receita/Atestado)", () => {
    for (const acao of ACOES_ORCAMENTO) {
      expect(pode("recepcao", acao)).toBe(true);
      expect(() => assertPode("recepcao", acao)).not.toThrow();
    }
  });

  it("admin da clínica também está autorizado em todas as ações", () => {
    for (const acao of ACOES_ORCAMENTO) {
      expect(pode("admin", acao)).toBe(true);
    }
  });
});
