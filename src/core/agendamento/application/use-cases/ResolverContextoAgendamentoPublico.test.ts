import { describe, expect, it } from "vitest";

import {
  AcessoClinicaInativoParaLinkPublicoError,
  ClinicaInelegivelParaLinkPublicoError,
  ClinicaNaoEncontradaPorSlugError,
  ProfissionalNaoEncontradoPorSlugError,
} from "../../domain/errors";
import {
  seedContextoLinkPublico,
  SLUG_CLINICA,
  SLUG_PROFISSIONAL,
} from "./helpers-test-link-publico";
import { ResolverContextoAgendamentoPublico } from "./ResolverContextoAgendamentoPublico";

function sut(ctx: Awaited<ReturnType<typeof seedContextoLinkPublico>>) {
  return new ResolverContextoAgendamentoPublico(
    ctx.clinicaRepo,
    ctx.profissionalRepo,
    ctx.verificarAcessoAtivo,
  );
}

describe("ResolverContextoAgendamentoPublico", () => {
  it("resolve clínica ativa com acesso permitido pelo slug", async () => {
    const ctx = await seedContextoLinkPublico();
    const contexto = await sut(ctx).executar({ slugClinica: SLUG_CLINICA });

    expect(contexto.clinicaId).toBe(ctx.clinicaId);
    expect(contexto.slug).toBe(SLUG_CLINICA);
    expect(contexto.canal).toBe("link-publico");
    expect(contexto.profissionalSlug).toBeUndefined();
  });

  it("resolve também profissionalSlug quando informado e pertence à clínica", async () => {
    const ctx = await seedContextoLinkPublico();
    const contexto = await sut(ctx).executar({
      slugClinica: SLUG_CLINICA,
      slugProfissional: SLUG_PROFISSIONAL,
    });

    expect(contexto.profissionalSlug).toBe(SLUG_PROFISSIONAL);
    expect(contexto.profissionalPreResolvido).toBe(true);
  });

  it("falha quando o slug da clínica não existe", async () => {
    const ctx = await seedContextoLinkPublico();
    await expect(
      sut(ctx).executar({ slugClinica: "clinica-inexistente" }),
    ).rejects.toBeInstanceOf(ClinicaNaoEncontradaPorSlugError);
  });

  it("falha quando a clínica está inativa", async () => {
    const ctx = await seedContextoLinkPublico({ statusClinica: "inativa" });
    await expect(
      sut(ctx).executar({ slugClinica: SLUG_CLINICA }),
    ).rejects.toBeInstanceOf(ClinicaInelegivelParaLinkPublicoError);
  });

  it("falha quando VerificarAcessoAtivo nega mesmo com clínica ativa", async () => {
    const ctx = await seedContextoLinkPublico({ comAssinaturaAtiva: false });
    await expect(
      sut(ctx).executar({ slugClinica: SLUG_CLINICA }),
    ).rejects.toBeInstanceOf(AcessoClinicaInativoParaLinkPublicoError);
  });

  it("falha quando profissionalSlug não existe na clínica", async () => {
    const ctx = await seedContextoLinkPublico();
    await expect(
      sut(ctx).executar({
        slugClinica: SLUG_CLINICA,
        slugProfissional: "dentista-fantasma",
      }),
    ).rejects.toBeInstanceOf(ProfissionalNaoEncontradoPorSlugError);
  });
});
