import { describe, expect, it } from "vitest";

import {
  DOMINIO_PUBLICO,
  previewUrlPublica,
  urlPublicaAbsoluta,
} from "./url-publica";

describe("URL pública de agendamento", () => {
  it("usa o domínio real da plataforma", () => {
    expect(DOMINIO_PUBLICO).toBe("dentyvo.com.br");
  });

  it("monta o preview sem esquema, para exibição compacta", () => {
    expect(previewUrlPublica("/agendar/clinica-demo")).toBe(
      "dentyvo.com.br/agendar/clinica-demo",
    );
  });

  it("monta a URL absoluta a partir da origem informada", () => {
    expect(
      urlPublicaAbsoluta("/agendar/clinica-demo", "https://app.exemplo.com"),
    ).toBe("https://app.exemplo.com/agendar/clinica-demo");
  });

  it("cai no domínio de produção quando não há origem disponível", () => {
    expect(urlPublicaAbsoluta("/agendar/clinica-demo")).toBe(
      "https://dentyvo.com.br/agendar/clinica-demo",
    );
    expect(urlPublicaAbsoluta("/agendar/clinica-demo", "")).toBe(
      "https://dentyvo.com.br/agendar/clinica-demo",
    );
  });
});
