import { describe, expect, it } from "vitest";

import { PAPEIS, type Papel } from "@/core/auth/domain/Papel";
import { PermissaoNegadaError } from "@/core/shared/errors";

import {
  ACOES_WHATSAPP,
  assertPode,
  pode,
  type AcaoWhatsapp,
} from "./autorizacao";

const MATRIZ_ESPERADA: Record<AcaoWhatsapp, readonly Papel[]> = {
  iniciar_conexao_whatsapp: ["admin"],
  concluir_conexao_whatsapp: ["admin"],
  desconectar_whatsapp: ["admin"],
  ver_status_whatsapp: ["admin"],
};

describe("matriz de autorização do módulo whatsapp-bot (spec 008)", () => {
  it.each(ACOES_WHATSAPP)(
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

  it("só admin pode iniciar, concluir e desconectar WhatsApp", () => {
    for (const acao of ACOES_WHATSAPP) {
      expect(pode("admin", acao)).toBe(true);
      expect(pode("dentista", acao)).toBe(false);
      expect(pode("recepcao", acao)).toBe(false);
    }
  });

  it("expõe a leitura de status como ação própria da matriz", () => {
    expect(ACOES_WHATSAPP).toContain("ver_status_whatsapp");
  });

  it("renovar token não faz parte da matriz de papéis de clínica (é job)", () => {
    expect(ACOES_WHATSAPP).not.toContain("renovar_token_whatsapp");
    expect(
      (ACOES_WHATSAPP as readonly string[]).includes("renovar_token_whatsapp"),
    ).toBe(false);
  });
});
