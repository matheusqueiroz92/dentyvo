import { describe, expect, it } from "vitest";

import { Clinica } from "@/core/auth/domain/Clinica";
import { DocumentoFiscal } from "@/core/auth/domain/DocumentoFiscal";
import { DadosInvalidosError } from "@/core/shared/errors";

import {
  CANAL_AGENDAMENTO_PUBLICO,
  ContextoAgendamentoPublico,
  assertClinicaAtivaParaLinkPublico,
  montarContextoAgendamentoPublico,
} from "./ContextoAgendamentoPublico";
import { ClinicaInelegivelParaLinkPublicoError } from "./errors";

describe("ContextoAgendamentoPublico", () => {
  const documento = DocumentoFiscal.criar("cpf", "39053344705");

  function clinicaAtiva(slug = "clinica-sorriso") {
    return Clinica.criar({
      id: "cli-1",
      nome: "Clínica Sorriso",
      endereco: "Rua A",
      documento,
      slug,
    });
  }

  it("fixa canal fixo link-publico e normaliza slugs", () => {
    const ctx = ContextoAgendamentoPublico.criar({
      clinicaId: "cli-1",
      slug: "Clinica-Sorriso",
      profissionalSlug: "Dr-Ana",
    });
    expect(ctx.canal).toBe(CANAL_AGENDAMENTO_PUBLICO);
    expect(ctx.slug).toBe("clinica-sorriso");
    expect(ctx.profissionalSlug).toBe("dr-ana");
    expect(ctx.profissionalPreResolvido).toBe(true);
  });

  it("profissionalSlug opcional", () => {
    const ctx = ContextoAgendamentoPublico.criar({
      clinicaId: "cli-1",
      slug: "clinica-sorriso",
    });
    expect(ctx.profissionalSlug).toBeUndefined();
    expect(ctx.profissionalPreResolvido).toBe(false);
  });

  it("rejeita slug inválido", () => {
    expect(() =>
      ContextoAgendamentoPublico.criar({
        clinicaId: "cli-1",
        slug: "@@@",
      }),
    ).toThrow(DadosInvalidosError);
  });

  it("assertClinicaAtivaParaLinkPublico rejeita clínica inativa", () => {
    const inativa = clinicaAtiva().desativar();
    expect(() => assertClinicaAtivaParaLinkPublico(inativa)).toThrow(
      ClinicaInelegivelParaLinkPublicoError,
    );
  });

  it("montarContextoAgendamentoPublico usa slug da clínica ativa", () => {
    const ctx = montarContextoAgendamentoPublico({
      clinica: clinicaAtiva("sorriso-vc"),
      profissionalSlug: "dra-ana",
    });
    expect(ctx.clinicaId).toBe("cli-1");
    expect(ctx.slug).toBe("sorriso-vc");
    expect(ctx.profissionalSlug).toBe("dra-ana");
    expect(ctx.canal).toBe("link-publico");
  });

  it("montarContextoAgendamentoPublico falha se clínica inativa", () => {
    expect(() =>
      montarContextoAgendamentoPublico({
        clinica: clinicaAtiva().desativar(),
      }),
    ).toThrow(ClinicaInelegivelParaLinkPublicoError);
  });
});
