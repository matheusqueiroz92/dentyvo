import { describe, expect, it } from "vitest";

import { apiDocsLiberado, getApiDocs } from "./swagger";

describe("apiDocsLiberado", () => {
  it("libera a UI em development e test", () => {
    expect(apiDocsLiberado("development")).toBe(true);
    expect(apiDocsLiberado("test")).toBe(true);
  });

  it("bloqueia acesso público em production", () => {
    expect(apiDocsLiberado("production")).toBe(false);
  });
});

describe("getApiDocs", () => {
  it("gera spec OpenAPI a partir dos comentários @swagger das rotas", async () => {
    const spec = await getApiDocs();

    expect(spec.openapi).toMatch(/^3\./);
    expect(spec.info?.title).toMatch(/Dentyvo/i);
    expect(spec.paths?.["/api/auth/{all}"]).toBeDefined();
    expect(spec.paths?.["/api/whatsapp/webhook"]).toBeDefined();
  });

  it("não documenta o agendamento público como API REST (é Server Action)", async () => {
    const spec = await getApiDocs();
    const paths = Object.keys(spec.paths ?? {});

    expect(paths.some((p) => p.startsWith("/agendar"))).toBe(false);
    expect(paths.some((p) => p.includes("agendamento-publico"))).toBe(false);
  });
});
