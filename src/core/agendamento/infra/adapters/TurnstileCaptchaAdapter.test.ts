import { afterEach, describe, expect, it, vi } from "vitest";

import { TurnstileCaptchaAdapter } from "./TurnstileCaptchaAdapter";

describe("TurnstileCaptchaAdapter", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("em development sem secret, aceita token não vazio (bypass explícito)", async () => {
    const adapter = new TurnstileCaptchaAdapter(undefined, "development");
    await expect(adapter.verificar("token-qualquer")).resolves.toBe(true);
  });

  it("em development sem secret, rejeita token vazio", async () => {
    const adapter = new TurnstileCaptchaAdapter(undefined, "development");
    await expect(adapter.verificar("")).resolves.toBe(false);
  });

  it("sem secret em test falha alto — nunca aceita token", async () => {
    const adapter = new TurnstileCaptchaAdapter(undefined, "test");
    await expect(adapter.verificar("token-qualquer")).rejects.toThrow(
      "TURNSTILE_SECRET_KEY não configurada",
    );
  });

  it("sem secret em production falha alto", async () => {
    const adapter = new TurnstileCaptchaAdapter(undefined, "production");
    await expect(adapter.verificar("token-qualquer")).rejects.toThrow(
      "TURNSTILE_SECRET_KEY não configurada",
    );
  });

  it("sem secret em preview/staging falha alto", async () => {
    const adapter = new TurnstileCaptchaAdapter(undefined, "production");
    await expect(adapter.verificar("x")).rejects.toThrow(
      "TURNSTILE_SECRET_KEY não configurada",
    );
  });

  it("com secret, rejeita quando siteverify retorna success=false", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: false }),
      }),
    );

    const adapter = new TurnstileCaptchaAdapter("secret-de-teste", "test");
    await expect(adapter.verificar("token-invalido")).resolves.toBe(false);
  });

  it("com secret, aceita quando siteverify retorna success=true", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const adapter = new TurnstileCaptchaAdapter("secret-de-teste", "test");
    await expect(adapter.verificar("token-valido", "1.2.3.4")).resolves.toBe(
      true,
    );
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
