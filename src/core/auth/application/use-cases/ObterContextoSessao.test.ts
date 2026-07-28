import { describe, expect, it } from "vitest";

import { SESSAO_TTL_MS } from "../../domain/constants";
import { FakeAuthPort } from "../test-doubles/fakes";
import { ObterContextoSessao } from "./ObterContextoSessao";

describe("ObterContextoSessao", () => {
  it("retorna contexto quando há sessão válida", async () => {
    const auth = new FakeAuthPort();
    const contexto = {
      usuarioId: "u1",
      clinicaId: "c1",
      papel: "admin" as const,
      profissionalId: "p1",
    };
    auth.definirSessao(contexto);
    const sut = new ObterContextoSessao(auth);

    await expect(sut.executar()).resolves.toEqual(contexto);
  });

  it("retorna null sem sessão", async () => {
    const auth = new FakeAuthPort();
    const sut = new ObterContextoSessao(auth);

    await expect(sut.executar()).resolves.toBeNull();
  });

  it("retorna null quando a sessão excede o TTL de 7 dias", async () => {
    const auth = new FakeAuthPort();
    const criadaEm = new Date("2026-07-01T00:00:00.000Z");
    auth.agora = criadaEm;
    auth.definirSessao(
      {
        usuarioId: "u1",
        clinicaId: "c1",
        papel: "dentista",
        profissionalId: "p1",
      },
      criadaEm,
    );

    auth.agora = new Date(criadaEm.getTime() + SESSAO_TTL_MS);
    const sut = new ObterContextoSessao(auth);

    await expect(sut.executar()).resolves.toBeNull();
  });

  it("ainda retorna contexto um instante antes de completar 7 dias", async () => {
    const auth = new FakeAuthPort();
    const criadaEm = new Date("2026-07-01T00:00:00.000Z");
    auth.definirSessao(
      {
        usuarioId: "u1",
        clinicaId: "c1",
        papel: "recepcao",
        profissionalId: "p1",
      },
      criadaEm,
    );
    auth.agora = new Date(criadaEm.getTime() + SESSAO_TTL_MS - 1);

    const sut = new ObterContextoSessao(auth);

    await expect(sut.executar()).resolves.toMatchObject({
      usuarioId: "u1",
      clinicaId: "c1",
      papel: "recepcao",
    });
  });
});
