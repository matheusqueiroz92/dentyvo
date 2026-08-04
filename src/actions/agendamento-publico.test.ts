import { beforeEach, describe, expect, it, vi } from "vitest";

const { captchaFake, rateLimitFake, marcarExecutar } = vi.hoisted(() => ({
  captchaFake: { verificar: vi.fn() },
  rateLimitFake: { permitir: vi.fn() },
  marcarExecutar: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: async () =>
    new Headers({ "x-forwarded-for": "203.0.113.10" }),
}));

vi.mock("@/core/agendamento/infra/create-agendamento-module", () => ({
  createAgendamentoModule: () => ({
    rateLimit: rateLimitFake,
    captcha: captchaFake,
    resolverContextoAgendamentoPublico: {
      executar: vi.fn().mockResolvedValue({
        clinicaId: "cli-1",
        slug: "clinica-demo",
      }),
    },
    marcarConsultaViaLinkPublico: {
      executar: marcarExecutar,
    },
  }),
}));

import { marcarConsultaPublicaAction } from "./agendamento-publico";

const inputValido = {
  slugClinica: "clinica-demo",
  nome: "Maria",
  telefone: "77999991111",
  cpf: "390.533.447-05",
  dataNascimentoIso: "1995-05-15T12:00:00.000Z",
  procedimentoId: "proc-1",
  profissionalId: "prof-1",
  dataHoraInicioIso: "2026-08-10T12:00:00.000Z",
  aceiteComunicacaoLembretes: true as const,
  captchaToken: "token-invalido",
};

describe("marcarConsultaPublicaAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rateLimitFake.permitir.mockResolvedValue(true);
  });

  it("rejeita com CaptchaInvalidoError quando o token é inválido (sem chamar o use case)", async () => {
    captchaFake.verificar.mockResolvedValue(false);

    const result = await marcarConsultaPublicaAction(inputValido);

    expect(result).toMatchObject({
      serverError: {
        codigo: "CaptchaInvalidoError",
        mensagem: "Validação CAPTCHA falhou. Tente novamente.",
      },
    });
    expect(captchaFake.verificar).toHaveBeenCalledWith(
      "token-invalido",
      "203.0.113.10",
    );
    expect(marcarExecutar).not.toHaveBeenCalled();
  });

  it("rejeita com RateLimitExcedidoError quando o rate limit bloqueia antes do CAPTCHA", async () => {
    rateLimitFake.permitir.mockResolvedValue(false);

    const result = await marcarConsultaPublicaAction(inputValido);

    expect(result).toMatchObject({
      serverError: {
        codigo: "RateLimitExcedidoError",
      },
    });
    expect(captchaFake.verificar).not.toHaveBeenCalled();
    expect(marcarExecutar).not.toHaveBeenCalled();
  });
});
