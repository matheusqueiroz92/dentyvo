import { describe, expect, it } from "vitest";

import { iniciaisDoNome } from "./iniciais";

describe("iniciaisDoNome", () => {
  it("usa primeira e última palavra", () => {
    expect(iniciaisDoNome("Ana Clara Souza")).toBe("AS");
  });

  it("usa duas letras quando há só um nome", () => {
    expect(iniciaisDoNome("João")).toBe("JO");
  });
});
