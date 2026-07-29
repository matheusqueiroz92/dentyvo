import { describe, expect, it } from "vitest";

import {
  LIMITE_VAGAS_PROMOCIONAIS_LANCAMENTO,
} from "../../domain/constants";
import { VagasPromocionaisEsgotadasError } from "../../domain/errors";
import { FakeVagaPromocionalRepository } from "../test-doubles/fakes";

const AGORA = new Date("2026-07-01T12:00:00.000Z");

/**
 * Documenta o contrato de `VagaPromocionalRepositoryPort.reservarAtomico`
 * (spec 012, D3): retry em unique_violation de posição. O fake espelha o
 * comportamento esperado do adapter; atomicidade real fica no Postgres
 * (teste de integração futuro).
 */
describe("VagaPromocionalRepositoryPort.reservarAtomico (contrato / fake)", () => {
  it("retenta após conflito simulado de posição e grava uma única vaga", async () => {
    const repo = new FakeVagaPromocionalRepository();
    repo.conflitosPosicaoPendentes = 2;

    const vaga = await repo.reservarAtomico({
      clinicaId: "clinica-a",
      assinaturaId: "ass-a",
      agora: AGORA,
    });

    expect(vaga.posicao).toBe(1);
    expect(repo.tentativasInsert).toBe(3); // 2 conflitos + 1 sucesso
    expect(await repo.contarReservadas()).toBe(1);
  });

  it("duas reservas concorrentes (Promise.all) obtêm posições distintas sem duplicar", async () => {
    const repo = new FakeVagaPromocionalRepository();

    const [a, b] = await Promise.all([
      repo.reservarAtomico({
        clinicaId: "clinica-1",
        assinaturaId: "ass-1",
        agora: AGORA,
      }),
      repo.reservarAtomico({
        clinicaId: "clinica-2",
        assinaturaId: "ass-2",
        agora: AGORA,
      }),
    ]);

    expect(a.posicao).not.toBe(b.posicao);
    expect(new Set([a.posicao, b.posicao]).size).toBe(2);
    expect(await repo.contarReservadas()).toBe(2);
  });

  it("com conflitos injetados em paralelo, ainda respeita posições únicas e limite 30", async () => {
    const repo = new FakeVagaPromocionalRepository();
    repo.conflitosPosicaoPendentes = 5;

    const resultados = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        repo.reservarAtomico({
          clinicaId: `clinica-p-${i}`,
          assinaturaId: `ass-p-${i}`,
          agora: AGORA,
        }),
      ),
    );

    const posicoes = resultados.map((v) => v.posicao);
    expect(new Set(posicoes).size).toBe(10);
    expect(await repo.contarReservadas()).toBe(10);
  });

  it("a 31ª reserva falha com VagasPromocionaisEsgotadasError", async () => {
    const repo = new FakeVagaPromocionalRepository();
    for (let i = 1; i <= LIMITE_VAGAS_PROMOCIONAIS_LANCAMENTO; i++) {
      await repo.reservarAtomico({
        clinicaId: `c-${i}`,
        assinaturaId: `a-${i}`,
        agora: AGORA,
      });
    }

    await expect(
      repo.reservarAtomico({
        clinicaId: "c-31",
        assinaturaId: "a-31",
        agora: AGORA,
      }),
    ).rejects.toBeInstanceOf(VagasPromocionaisEsgotadasError);
  });

  it("segunda reserva da mesma clínica é idempotente (não consome outra posição)", async () => {
    const repo = new FakeVagaPromocionalRepository();
    const primeira = await repo.reservarAtomico({
      clinicaId: "clinica-x",
      assinaturaId: "ass-1",
      agora: AGORA,
    });
    const segunda = await repo.reservarAtomico({
      clinicaId: "clinica-x",
      assinaturaId: "ass-2",
      agora: AGORA,
    });

    expect(segunda.posicao).toBe(primeira.posicao);
    expect(await repo.contarReservadas()).toBe(1);
  });
});
