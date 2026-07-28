import { describe, expect, it } from "vitest";

import { PermissaoNegadaError } from "@/core/shared/errors";

import {
  ACOES_ADMIN_PLATAFORMA,
  assertPode,
  pode,
} from "./autorizacao";
import type { PapelPlataforma } from "./PapelPlataforma";
import { UsuarioPlataforma } from "./UsuarioPlataforma";

function superAdmin() {
  return UsuarioPlataforma.criar({
    id: "plat-1",
    nome: "Dono",
    email: "dono@dentyvo.com",
  });
}

/** Impostor só para testar o gate binário — bypassa factory de papel. */
function naoSuperAdmin() {
  return UsuarioPlataforma.reconstituir({
    id: "fake",
    nome: "Impostor",
    email: "imp@x.com",
    papel: "admin" as PapelPlataforma,
  });
}

describe("autorização admin-plataforma (gate binário super-admin)", () => {
  it.each(ACOES_ADMIN_PLATAFORMA)(
    "super-admin pode executar a ação %s",
    (acao) => {
      const usuario = superAdmin();
      expect(pode(usuario, acao)).toBe(true);
      expect(() => assertPode(usuario, acao)).not.toThrow();
    },
  );

  it.each(ACOES_ADMIN_PLATAFORMA)(
    "quem não é super-admin é negado na ação %s",
    (acao) => {
      const usuario = naoSuperAdmin();
      expect(pode(usuario, acao)).toBe(false);
      expect(() => assertPode(usuario, acao)).toThrow(PermissaoNegadaError);
    },
  );
});
