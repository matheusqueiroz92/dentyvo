import { describe, expect, it } from "vitest";

import { deveAutorizarCriacaoSessaoSocial } from "@/lib/auth-sessao-social";

describe("deveAutorizarCriacaoSessaoSocial", () => {
  it("permite criação de sessão fora do callback social (ex.: sign-up email)", () => {
    expect(
      deveAutorizarCriacaoSessaoSocial({
        path: "/sign-up/email",
        temVinculoAutorizado: false,
      }),
    ).toBe(true);
  });

  it("permite callback social sem vínculo (onboarding — cria/retoma cadastro)", () => {
    expect(
      deveAutorizarCriacaoSessaoSocial({
        path: "/callback/google",
        temVinculoAutorizado: false,
      }),
    ).toBe(true);
  });

  it("permite callback social quando há vínculo autorizado", () => {
    expect(
      deveAutorizarCriacaoSessaoSocial({
        path: "/sign-in/social",
        temVinculoAutorizado: true,
      }),
    ).toBe(true);
  });
});
