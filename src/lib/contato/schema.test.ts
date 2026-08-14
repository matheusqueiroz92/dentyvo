import { describe, expect, it } from "vitest";

import { contatoLandingSchema, contatoSuporteSchema } from "./schema";

describe("contatoLandingSchema", () => {
  it("aceita nome, e-mail e mensagem válidos", () => {
    const parsed = contatoLandingSchema.safeParse({
      nome: " Ana ",
      email: "ana@clinica.com.br",
      mensagem: "Quero saber mais sobre o plano Médio.",
    });
    expect(parsed.success).toBe(true);
  });

  it("exige e-mail válido", () => {
    const parsed = contatoLandingSchema.safeParse({
      nome: "Ana",
      email: "nao-e-email",
      mensagem: "Mensagem com tamanho suficiente.",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("contatoSuporteSchema", () => {
  it("aceita relato de bug com assunto e descrição", () => {
    const parsed = contatoSuporteSchema.safeParse({
      nome: "Dr. Carlos",
      assunto: "Agenda não carrega",
      descricao: "Ao abrir a agenda do dia a lista fica em branco.",
      tipo: "bug",
    });
    expect(parsed.success).toBe(true);
  });

  it("exige tipo bug ou dúvida", () => {
    const parsed = contatoSuporteSchema.safeParse({
      nome: "Dr. Carlos",
      assunto: "Dúvida",
      descricao: "Como altero o horário de funcionamento?",
      tipo: "outro",
    });
    expect(parsed.success).toBe(false);
  });

  it("exige descrição com pelo menos 10 caracteres", () => {
    const parsed = contatoSuporteSchema.safeParse({
      nome: "Dr. Carlos",
      assunto: "Dúvida",
      descricao: "curto",
      tipo: "duvida",
    });
    expect(parsed.success).toBe(false);
  });
});
