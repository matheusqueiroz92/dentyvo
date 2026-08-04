import { describe, expect, it, vi } from "vitest";

import {
  CaptchaInvalidoError,
  RateLimitExcedidoError,
} from "@/core/agendamento/domain/errors";
import { InMemoryRateLimitAdapter } from "@/core/agendamento/infra/adapters/InMemoryRateLimitAdapter";

import {
  assertCaptchaPublico,
  assertRateLimitPublico,
  chaveRateLimitPublico,
} from "./protecao-agendamento-publico";

describe("protecao-agendamento-publico", () => {
  describe("assertRateLimitPublico", () => {
    it("bloqueia após o limite configurado para o mesmo slug/IP", async () => {
      const rateLimit = new InMemoryRateLimitAdapter(2, 60_000);
      const chave = chaveRateLimitPublico("203.0.113.10", "clinica-demo");

      await expect(assertRateLimitPublico(rateLimit, chave)).resolves.toBeUndefined();
      await expect(assertRateLimitPublico(rateLimit, chave)).resolves.toBeUndefined();
      await expect(assertRateLimitPublico(rateLimit, chave)).rejects.toBeInstanceOf(
        RateLimitExcedidoError,
      );
    });

    it("não compartilha contador entre chaves IP+slug distintas", async () => {
      const rateLimit = new InMemoryRateLimitAdapter(1, 60_000);
      const a = chaveRateLimitPublico("203.0.113.10", "clinica-a");
      const b = chaveRateLimitPublico("203.0.113.10", "clinica-b");

      await assertRateLimitPublico(rateLimit, a);
      await expect(assertRateLimitPublico(rateLimit, b)).resolves.toBeUndefined();
      await expect(assertRateLimitPublico(rateLimit, a)).rejects.toBeInstanceOf(
        RateLimitExcedidoError,
      );
    });
  });

  describe("assertCaptchaPublico", () => {
    it("rejeita com CaptchaInvalidoError quando o CaptchaPort simula rejeição", async () => {
      const captcha = {
        verificar: vi.fn().mockResolvedValue(false),
      };

      await expect(
        assertCaptchaPublico(captcha, "token-invalido", "203.0.113.10"),
      ).rejects.toBeInstanceOf(CaptchaInvalidoError);

      expect(captcha.verificar).toHaveBeenCalledWith(
        "token-invalido",
        "203.0.113.10",
      );
    });

    it("aceita quando o CaptchaPort valida o token", async () => {
      const captcha = {
        verificar: vi.fn().mockResolvedValue(true),
      };

      await expect(
        assertCaptchaPublico(captcha, "token-valido"),
      ).resolves.toBeUndefined();
    });
  });
});
