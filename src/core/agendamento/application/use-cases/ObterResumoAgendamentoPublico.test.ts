import { describe, expect, it } from "vitest";

import { ContextoAgendamentoPublico } from "../../domain/ContextoAgendamentoPublico";
import { ROTULO_PROCEDIMENTO_CATCH_ALL } from "../../domain/MenuPublicoProcedimento";
import {
  seedContextoLinkPublico,
  SLUG_CLINICA,
  SLUG_PROFISSIONAL,
} from "./helpers-test-link-publico";
import { ObterResumoAgendamentoPublico } from "./ObterResumoAgendamentoPublico";

function sut(ctx: Awaited<ReturnType<typeof seedContextoLinkPublico>>) {
  return new ObterResumoAgendamentoPublico(
    ctx.clinicaRepo,
    ctx.profissionalRepo,
    ctx.menuRepo,
  );
}

function contextoClinica(ctx: Awaited<ReturnType<typeof seedContextoLinkPublico>>) {
  return ContextoAgendamentoPublico.criar({
    clinicaId: ctx.clinicaId,
    slug: SLUG_CLINICA,
  });
}

describe("ObterResumoAgendamentoPublico", () => {
  it("retorna nome/logo/slug da clínica e profissionais elegíveis", async () => {
    const ctx = await seedContextoLinkPublico();
    const resumo = await sut(ctx).executar({ contexto: contextoClinica(ctx) });

    expect(resumo.clinica).toEqual({
      id: ctx.clinicaId,
      nome: ctx.clinica.nome,
      slug: SLUG_CLINICA,
      logoUrl: null,
      tema: null,
    });
    expect(resumo.profissionais.some((p) => p.slug === SLUG_PROFISSIONAL)).toBe(
      true,
    );
  });

  it("com profissional pré-resolvido, lista só esse profissional", async () => {
    const ctx = await seedContextoLinkPublico();
    const contexto = ContextoAgendamentoPublico.criar({
      clinicaId: ctx.clinicaId,
      slug: SLUG_CLINICA,
      profissionalSlug: SLUG_PROFISSIONAL,
    });

    const resumo = await sut(ctx).executar({ contexto });

    expect(resumo.profissionais).toHaveLength(1);
    expect(resumo.profissionais[0]).toMatchObject({
      id: ctx.dentista.id,
      slug: SLUG_PROFISSIONAL,
    });
  });

  it("sem menu configurado, expõe catch-all Consulta/Avaliação", async () => {
    const ctx = await seedContextoLinkPublico({ comMenuConfigurado: false });
    const resumo = await sut(ctx).executar({ contexto: contextoClinica(ctx) });

    expect(resumo.menu).toHaveLength(1);
    expect(resumo.menu[0]?.rotuloPublico).toBe(ROTULO_PROCEDIMENTO_CATCH_ALL);
    expect(resumo.menu[0]?.procedimentoId).toBeTruthy();
  });

  it("com menu configurado, expõe os rótulos públicos mapeados", async () => {
    const ctx = await seedContextoLinkPublico({ comMenuConfigurado: true });
    const resumo = await sut(ctx).executar({ contexto: contextoClinica(ctx) });

    expect(resumo.menu).toHaveLength(2);
    expect(resumo.menu.map((i) => i.rotuloPublico)).toEqual([
      "Consulta/Avaliação",
      "Limpeza",
    ]);
    expect(resumo.menu.map((i) => i.procedimentoId)).toEqual([
      ctx.procedimentoConsulta.id,
      ctx.procedimentoLimpeza.id,
    ]);
  });
});
