import { describe, expect, it } from "vitest";

import { TenantMismatchError } from "@/core/shared/errors";

import { Orcamento } from "../../domain/Orcamento";
import { cabecalhoValido } from "../test-doubles/fakes";
import { seedContextoOrcamento } from "./helpers-test";
import { ListarOrcamentosDoProntuario } from "./ListarOrcamentosDoProntuario";

function orcamentoEmitido(
  ctx: Awaited<ReturnType<typeof seedContextoOrcamento>>,
  input: {
    id: string;
    emitidoEm: Date;
    validoAte?: Date | null;
  },
): Orcamento {
  return Orcamento.emitir({
    id: input.id,
    clinicaId: ctx.clinicaId,
    prontuarioId: ctx.prontuario.id,
    profissionalId: ctx.profissional.id,
    itens: [
      {
        procedimentoId: ctx.procedimento.id,
        nome: "Limpeza",
        valor: 150,
      },
    ],
    cabecalho: cabecalhoValido,
    validoAte: input.validoAte,
    emitidoEm: input.emitidoEm,
  });
}

describe("ListarOrcamentosDoProntuario", () => {
  it.each(["admin", "dentista", "recepcao"] as const)(
    "%s lista histórico do prontuário (mais recente primeiro) com validoAte",
    async (papel) => {
      const ctx = await seedContextoOrcamento(papel);
      const prazo = new Date("2026-10-01T00:00:00.000Z");
      const antiga = orcamentoEmitido(ctx, {
        id: "orc-antiga",
        emitidoEm: new Date("2026-07-01T10:00:00.000Z"),
        validoAte: null,
      });
      const recente = orcamentoEmitido(ctx, {
        id: "orc-recente",
        emitidoEm: new Date("2026-07-20T10:00:00.000Z"),
        validoAte: prazo,
      });
      await ctx.orcamentoRepo.salvar(antiga);
      await ctx.orcamentoRepo.salvar(recente);

      const sut = new ListarOrcamentosDoProntuario(
        ctx.orcamentoRepo,
        ctx.profissionalRepo,
      );

      const lista = await sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        prontuarioId: ctx.prontuario.id,
      });

      expect(lista.map((o) => o.id)).toEqual(["orc-recente", "orc-antiga"]);
      expect(lista[0]!.validoAte).toEqual(prazo);
      expect(lista[1]!.validoAte).toBeNull();
    },
  );

  it("recepção NÃO é negada ao listar orçamentos", async () => {
    const ctx = await seedContextoOrcamento("recepcao");
    const sut = new ListarOrcamentosDoProntuario(
      ctx.orcamentoRepo,
      ctx.profissionalRepo,
    );

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        prontuarioId: ctx.prontuario.id,
      }),
    ).resolves.toEqual([]);
  });

  it("isola por tenant", async () => {
    const ctx = await seedContextoOrcamento("dentista");
    const sut = new ListarOrcamentosDoProntuario(
      ctx.orcamentoRepo,
      ctx.profissionalRepo,
    );

    await expect(
      sut.executar({
        clinicaId: "outra-clinica",
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        prontuarioId: ctx.prontuario.id,
      }),
    ).rejects.toBeInstanceOf(TenantMismatchError);
  });
});
