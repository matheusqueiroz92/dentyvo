import { describe, expect, it } from "vitest";

import { UsuarioPlataforma } from "@/core/admin-plataforma/domain/UsuarioPlataforma";
import type { PapelPlataforma } from "@/core/admin-plataforma/domain/PapelPlataforma";
import { PAPEIS, type Papel } from "@/core/auth/domain/Papel";
import { PermissaoNegadaError } from "@/core/shared/errors";

import {
  ACOES_ASSINATURA,
  assertPode,
  assertPodeConcederAcessoManual,
  pode,
  type AcaoAssinatura,
} from "./autorizacao";

const MATRIZ_ESPERADA: Record<AcaoAssinatura, readonly Papel[]> = {
  criar_assinatura: ["admin"],
};

function superAdmin() {
  return UsuarioPlataforma.criar({
    id: "plat-1",
    nome: "Dono",
    email: "dono@dentyvo.com",
  });
}

/** Impostor só para o gate binário — bypassa factory de papel. */
function naoSuperAdmin() {
  return UsuarioPlataforma.reconstituir({
    id: "fake",
    nome: "Impostor",
    email: "imp@x.com",
    papel: "admin" as PapelPlataforma,
  });
}

describe("autorização assinatura — RBAC de clínica (shared)", () => {
  it.each(ACOES_ASSINATURA)(
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

  it("só admin da clínica pode criar_assinatura; dentista e recepção são negados", () => {
    expect(pode("admin", "criar_assinatura")).toBe(true);
    expect(pode("dentista", "criar_assinatura")).toBe(false);
    expect(pode("recepcao", "criar_assinatura")).toBe(false);
  });

  it("conceder_acesso_manual não faz parte da matriz de AcaoAssinatura", () => {
    expect(ACOES_ASSINATURA).not.toContain("conceder_acesso_manual");
    expect(
      (ACOES_ASSINATURA as readonly string[]).includes("conceder_acesso_manual"),
    ).toBe(false);
  });
});

describe("autorização assinatura — gate binário super-admin (padrão 009)", () => {
  it("super-admin pode conceder acesso manual", () => {
    expect(() =>
      assertPodeConcederAcessoManual(superAdmin()),
    ).not.toThrow();
  });

  it("quem não é super-admin é negado — inclusive papel 'admin' de clínica", () => {
    expect(() =>
      assertPodeConcederAcessoManual(naoSuperAdmin()),
    ).toThrow(PermissaoNegadaError);
  });
});
