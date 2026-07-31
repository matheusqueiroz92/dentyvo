import { describe, expect, it } from "vitest";

import {
  ACOES_AUTORIZADAS,
  assertPode,
  pode,
  type AcaoAutorizada,
} from "./autorizacao";
import { PermissaoNegadaError } from "@/core/shared/errors";
import type { Papel } from "./Papel";
import { PAPEIS } from "./Papel";

const MATRIZ_ESPERADA: Record<AcaoAutorizada, readonly Papel[]> = {
  convidar_usuario: ["admin"],
  listar_membros: ["admin", "dentista", "recepcao"],
  alterar_papel_membro: ["admin"],
  remover_membro: ["admin"],
  revogar_sessoes_membro: ["admin"],
  editar_clinica: ["admin"],
  atualizar_logo_clinica: ["admin"],
  atualizar_tema_clinica: ["admin"],
};

describe("matriz de autorização (pode / assertPode)", () => {
  it.each(ACOES_AUTORIZADAS)(
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

  it("só admin pode convidar usuários (inclui convidar outro admin)", () => {
    expect(pode("admin", "convidar_usuario")).toBe(true);
    expect(pode("dentista", "convidar_usuario")).toBe(false);
    expect(pode("recepcao", "convidar_usuario")).toBe(false);
  });

  it("dentista e recepção não podem convidar ninguém", () => {
    expect(() => assertPode("dentista", "convidar_usuario")).toThrow(
      PermissaoNegadaError,
    );
    expect(() => assertPode("recepcao", "convidar_usuario")).toThrow(
      PermissaoNegadaError,
    );
  });
});
