import { describe, expect, it } from "vitest";

import { ProfissionalNaoEncontradoError } from "@/core/auth/domain/errors";

import { Agendamento } from "../../domain/Agendamento";
import { ContextoAgendamentoPublico } from "../../domain/ContextoAgendamentoPublico";
import {
  AcessoClinicaInativoParaLinkPublicoError,
  ProfissionalNaoEncontradoPorSlugError,
} from "../../domain/errors";
import {
  seedContextoLinkPublico,
  SLUG_CLINICA,
  SLUG_PROFISSIONAL,
} from "./helpers-test-link-publico";
import { ListarHorariosDisponiveisNoLinkPublico } from "./ListarHorariosDisponiveisNoLinkPublico";
import { segundaAs } from "./helpers-test";

function sut(ctx: Awaited<ReturnType<typeof seedContextoLinkPublico>>) {
  return new ListarHorariosDisponiveisNoLinkPublico(
    ctx.listarCore,
    ctx.profissionalRepo,
    ctx.verificarAcessoAtivo,
  );
}

function contexto(
  ctx: Awaited<ReturnType<typeof seedContextoLinkPublico>>,
  profissionalSlug?: string,
) {
  return ContextoAgendamentoPublico.criar({
    clinicaId: ctx.clinicaId,
    slug: SLUG_CLINICA,
    profissionalSlug,
  });
}

describe("ListarHorariosDisponiveisNoLinkPublico", () => {
  it("lista os mesmos slots livres que o núcleo (sem recalcular do zero)", async () => {
    const ctx = await seedContextoLinkPublico();
    await ctx.agendamentoRepo.salvarOcupandoSlot(
      Agendamento.criar({
        id: "ag-ocupado",
        clinicaId: ctx.clinicaId,
        pacienteId: "pac-x",
        profissionalId: ctx.dentista.id,
        procedimentoId: ctx.procedimentoConsulta.id,
        dataHoraInicio: segundaAs(9),
        duracaoMinutos: 60,
        origem: "painel",
      }),
    );

    const doNucleo = await ctx.listarCore.executar({
      clinicaId: ctx.clinicaId,
      profissionalId: ctx.dentista.id,
      data: segundaAs(0),
    });
    const doCanal = await sut(ctx).executar({
      contexto: contexto(ctx),
      profissionalId: ctx.dentista.id,
      data: segundaAs(0),
    });

    expect(doCanal).toEqual(doNucleo);
    expect(
      doCanal.some((h) => h.inicio.getTime() === segundaAs(9).getTime()),
    ).toBe(false);
    expect(
      doCanal.some((h) => h.inicio.getTime() === segundaAs(8).getTime()),
    ).toBe(true);
  });

  it("com profissional pré-resolvido, rejeita profissionalId diferente do slug", async () => {
    const ctx = await seedContextoLinkPublico();
    await expect(
      sut(ctx).executar({
        contexto: contexto(ctx, SLUG_PROFISSIONAL),
        profissionalId: ctx.admin.id,
        data: segundaAs(0),
      }),
    ).rejects.toBeInstanceOf(ProfissionalNaoEncontradoPorSlugError);
  });

  it("rejeita profissional de outra clínica / inexistente", async () => {
    const ctx = await seedContextoLinkPublico();
    await expect(
      sut(ctx).executar({
        contexto: contexto(ctx),
        profissionalId: "prof-inexistente",
        data: segundaAs(0),
      }),
    ).rejects.toBeInstanceOf(ProfissionalNaoEncontradoError);
  });

  it("falha quando o acesso da clínica não está ativo", async () => {
    const ctx = await seedContextoLinkPublico({ comAssinaturaAtiva: false });
    await expect(
      sut(ctx).executar({
        contexto: contexto(ctx),
        profissionalId: ctx.dentista.id,
        data: segundaAs(0),
      }),
    ).rejects.toBeInstanceOf(AcessoClinicaInativoParaLinkPublicoError);
  });
});
