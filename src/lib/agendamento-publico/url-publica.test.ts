import { afterEach, describe, expect, it } from "vitest";

import {
  origemPublicaDaApp,
  previewUrlPublica,
  urlPublicaAbsoluta,
} from "./url-publica";

const ENV_VERCEL = {
  NEXT_PUBLIC_APP_URL: "https://dentyvo-three.vercel.app",
} as NodeJS.ProcessEnv;

describe("origemPublicaDaApp", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  it("lê NEXT_PUBLIC_APP_URL e remove barra final", () => {
    expect(
      origemPublicaDaApp({
        NEXT_PUBLIC_APP_URL: "https://dentyvo-three.vercel.app/",
      }),
    ).toBe("https://dentyvo-three.vercel.app");
  });

  it("aceita host sem esquema e prefixa https", () => {
    expect(
      origemPublicaDaApp({ NEXT_PUBLIC_APP_URL: "dentyvo.com.br" }),
    ).toBe("https://dentyvo.com.br");
  });

  it("retorna null quando a variável não está definida", () => {
    expect(origemPublicaDaApp({})).toBeNull();
    expect(origemPublicaDaApp({ NEXT_PUBLIC_APP_URL: "   " })).toBeNull();
  });

  it("não cai em domínio hardcoded quando a variável está ausente", () => {
    expect(origemPublicaDaApp({})).not.toBe("https://dentyvo.com.br");
  });
});

describe("URL pública de agendamento", () => {
  it("monta o preview a partir de NEXT_PUBLIC_APP_URL, sem esquema", () => {
    expect(previewUrlPublica("/agendar/clinica-demo", ENV_VERCEL)).toBe(
      "dentyvo-three.vercel.app/agendar/clinica-demo",
    );
  });

  it("monta a URL absoluta a partir de NEXT_PUBLIC_APP_URL", () => {
    expect(urlPublicaAbsoluta("/agendar/clinica-demo", undefined, ENV_VERCEL)).toBe(
      "https://dentyvo-three.vercel.app/agendar/clinica-demo",
    );
  });

  it("origem explícita prevalece sobre a variável de ambiente", () => {
    expect(
      urlPublicaAbsoluta(
        "/agendar/clinica-demo",
        "https://app.exemplo.com/",
        ENV_VERCEL,
      ),
    ).toBe("https://app.exemplo.com/agendar/clinica-demo");
  });

  it("sem origem e sem variável, devolve só o caminho — nunca inventa dentyvo.com.br", () => {
    expect(previewUrlPublica("/agendar/clinica-demo", {})).toBe(
      "/agendar/clinica-demo",
    );
    expect(urlPublicaAbsoluta("/agendar/clinica-demo", undefined, {})).toBe(
      "/agendar/clinica-demo",
    );
    expect(urlPublicaAbsoluta("/agendar/clinica-demo", "", {})).toBe(
      "/agendar/clinica-demo",
    );
  });

  it("trocar NEXT_PUBLIC_APP_URL muda o host sem alterar o caminho", () => {
    expect(
      urlPublicaAbsoluta("/agendar/clinica-demo", undefined, {
        NEXT_PUBLIC_APP_URL: "https://dentyvo.com.br",
      }),
    ).toBe("https://dentyvo.com.br/agendar/clinica-demo");
  });
});
