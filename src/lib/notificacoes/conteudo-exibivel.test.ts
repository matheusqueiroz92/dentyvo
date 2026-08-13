import { describe, expect, it } from "vitest";

import type { NotificacaoDashboardDTO } from "@/lib/dashboard/types";

import { linhasConteudoExibivel } from "./conteudo-exibivel";

function dto(
  parcial: Partial<NotificacaoDashboardDTO> = {},
): NotificacaoDashboardDTO {
  return {
    id: "n-1",
    tipo: "trial_acabando",
    titulo: "Trial acabando",
    mensagem: "Seu período de avaliação termina em breve.",
    criadaEmIso: "2026-08-13T12:00:00.000Z",
    linkAcao: "/assinatura",
    planoNome: "Essencial",
    dataReferenciaIso: "2026-08-20T03:00:00.000Z",
    valorCentavos: 9900,
    ...parcial,
  };
}

describe("linhasConteudoExibivel", () => {
  it("expõe só campos operacionais da allowlist (plano, data, valor)", () => {
    const linhas = linhasConteudoExibivel(dto());
    const chaves = linhas.map((l) => l.chave);

    expect(chaves).toEqual(["planoNome", "dataReferenciaIso", "valorCentavos"]);
    expect(linhas.find((l) => l.chave === "planoNome")?.valor).toBe("Essencial");
    expect(linhas.find((l) => l.chave === "valorCentavos")?.valor).toMatch(
      /R\$\s*99,00/,
    );
  });

  it("não inclui IDs opacos mesmo que existam no objeto de origem", () => {
    const linhas = linhasConteudoExibivel(
      dto({
        // campos fora do DTO não devem vazar — o helper só lê a allowlist de UI
      }),
    );
    const texto = linhas.map((l) => `${l.chave}:${l.valor}`).join(" ");
    expect(texto).not.toMatch(/agendamentoId|cobrancaId|assinaturaId|conviteId|planoId/);
    expect(texto).not.toMatch(/pacienteNome|pacienteCpf|anamnese|textoClinico/);
  });

  it("omite linhas vazias", () => {
    const linhas = linhasConteudoExibivel(
      dto({
        planoNome: null,
        dataReferenciaIso: null,
        valorCentavos: null,
      }),
    );
    expect(linhas).toEqual([]);
  });
});
