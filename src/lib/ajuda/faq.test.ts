import { describe, expect, it } from "vitest";

import { FAQS_APP, FAQS_LANDING } from "./faq";

describe("FAQS_LANDING e FAQS_APP", () => {
  it("a landing tem o conjunto inicial de perguntas", () => {
    expect(FAQS_LANDING.map((item) => item.pergunta)).toEqual([
      "Preciso instalar algum programa?",
      "Como funciona o período de teste?",
      "A secretária virtual do WhatsApp substitui minha recepcionista?",
      "Meus dados e os dos meus pacientes estão seguros?",
      "Posso mudar de plano depois?",
      "Como funciona a promoção de lançamento?",
    ]);
  });

  it("o FAQ da aplicação reaproveita as perguntas da landing e amplia para quem já é cliente", () => {
    const perguntasLanding = FAQS_LANDING.map((item) => item.pergunta);
    const perguntasApp = FAQS_APP.map((item) => item.pergunta);

    expect(perguntasApp).toEqual(expect.arrayContaining(perguntasLanding));
    expect(FAQS_APP.length).toBeGreaterThan(FAQS_LANDING.length);
  });

  it("adapta respostas da landing ao contexto de quem já usa o painel", () => {
    const mudarPlano = FAQS_APP.find(
      (item) => item.pergunta === "Posso mudar de plano depois?",
    );
    expect(mudarPlano?.resposta).toMatch(/Configurações/i);
    expect(mudarPlano?.resposta).not.toBe(
      FAQS_LANDING.find((item) => item.pergunta === "Posso mudar de plano depois?")
        ?.resposta,
    );
  });
});
