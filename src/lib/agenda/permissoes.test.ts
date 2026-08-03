import { describe, expect, it } from "vitest";

import { permissoesAgendaParaPapel } from "./permissoes";

describe("permissoesAgendaParaPapel", () => {
  it("libera marcar/remarcar/cancelar/confirmar para admin, dentista e recepcao", () => {
    for (const papel of ["admin", "dentista", "recepcao"] as const) {
      const p = permissoesAgendaParaPapel(papel);
      expect(p.marcar).toBe(true);
      expect(p.remarcar).toBe(true);
      expect(p.cancelar).toBe(true);
      expect(p.confirmar).toBe(true);
    }
  });
});
