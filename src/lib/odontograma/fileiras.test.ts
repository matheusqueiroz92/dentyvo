import { describe, expect, it } from "vitest";

import { FILEIRAS_DENTICAO, fileirasVisiveis } from "./fileiras";

describe("fileirasVisiveis", () => {
  it("oculta fileiras decíduas quando mostrarDecidua é false", () => {
    const visiveis = fileirasVisiveis(false);
    expect(visiveis.every((f) => !f.decidua)).toBe(true);
    expect(visiveis).toHaveLength(2);
  });

  it("mostra as 4 arcadas quando mostrarDecidua é true", () => {
    expect(fileirasVisiveis(true)).toHaveLength(FILEIRAS_DENTICAO.length);
    expect(fileirasVisiveis(true)).toEqual(FILEIRAS_DENTICAO);
  });
});
