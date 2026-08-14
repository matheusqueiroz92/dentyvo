import { describe, expect, it } from "vitest";

import { CONTATO_EMAIL } from "./canais";
import { montarMailtoContato } from "./mailto";

describe("montarMailtoContato", () => {
  it("abre o e-mail comercial com assunto e corpo da landing", () => {
    const url = montarMailtoContato({
      nome: "Ana",
      email: "ana@clinica.com.br",
      mensagem: "Quero o trial.",
    });

    expect(url.startsWith(`mailto:${CONTATO_EMAIL}?`)).toBe(true);
    const params = new URL(url).searchParams;
    expect(params.get("subject")).toBe("Contato Dentyvo");
    expect(params.get("body")).toContain("Nome: Ana");
    expect(params.get("body")).toContain("E-mail: ana@clinica.com.br");
    expect(params.get("body")).toContain("Quero o trial.");
  });

  it("prefixa o assunto com o tipo no relato de suporte", () => {
    const url = montarMailtoContato({
      nome: "Carlos",
      assunto: "Agenda em branco",
      mensagem: "A lista não carrega.",
      tipo: "bug",
    });

    const params = new URL(url).searchParams;
    expect(params.get("subject")).toBe("[Bug] Agenda em branco");
    expect(params.get("body")).toContain("Tipo: Bug");
  });
});
