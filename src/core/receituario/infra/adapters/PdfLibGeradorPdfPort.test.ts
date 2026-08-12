import { describe, expect, it } from "vitest";

import { Atestado } from "@/core/atestado/domain/Atestado";

import { Receita } from "../../domain/Receita";
import {
  normalizarTextoPdf,
  PdfLibGeradorPdfPort,
} from "./PdfLibGeradorPdfPort";

async function textoDoPdf(bytes: Uint8Array): Promise<string> {
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const pdf = await getDocument({ data: bytes }).promise;
  const page = await pdf.getPage(1);
  const content = await page.getTextContent();
  return content.items
    .map((item) => ("str" in item ? item.str : ""))
    .join(" ");
}

const cabecalhoAcentuado = {
  clinicaNome: "Clínica Sorriso & Saúde",
  clinicaEndereco: "Rua José de Alencar, 100 — Centro, São Paulo",
  profissionalNome: "Dra. Márcia Gonçalves",
  profissionalCro: "SP-12345",
  pacienteNome: "José Antônio da Conceição",
  pacienteCpf: "529.982.247-25",
  pacienteDataNascimento: new Date("1990-05-15T00:00:00.000Z"),
  profissionalEspecialidade: "Endodontia",
};

describe("normalizarTextoPdf", () => {
  it("recompõe NFD sem remover acentos portugueses", () => {
    const nfd = "José".normalize("NFD");
    expect(nfd).toContain("\u0301");
    expect(normalizarTextoPdf(nfd)).toBe("José");
    expect(normalizarTextoPdf("áéíóúãõçâêô")).toBe("áéíóúãõçâêô");
  });

  it("troca só pontuação tipográfica por ASCII, preservando acentos", () => {
    expect(normalizarTextoPdf("Rua X — “Centro”")).toBe('Rua X - "Centro"');
    expect(normalizarTextoPdf("pós…procedimento")).toBe("pós...procedimento");
  });
});

describe("PdfLibGeradorPdfPort", () => {
  it("preserva acentos portugueses no PDF do atestado (nome, endereço, motivo)", async () => {
    const motivo =
      "Repouso pós-procedimento — inflamação aguda e edema".normalize("NFD");
    const atestado = Atestado.emitir({
      id: "atest-acentos",
      clinicaId: "clin-1",
      prontuarioId: "pront-1",
      profissionalId: "prof-1",
      motivo,
      cid: "K08.1",
      dataInicio: new Date("2026-08-11T00:00:00.000Z"),
      quantidadeDias: 3,
      cabecalho: cabecalhoAcentuado,
      emitidaEm: new Date("2026-08-11T15:00:00.000Z"),
    });

    const bytes = await new PdfLibGeradorPdfPort().gerarAtestado(atestado);
    const texto = await textoDoPdf(bytes);

    expect(texto).toContain("José Antônio da Conceição");
    expect(texto).toContain("Clínica Sorriso");
    expect(texto).toContain("São Paulo");
    expect(texto).toContain("Márcia Gonçalves");
    expect(texto).toContain("Repouso pós-procedimento");
    expect(texto).toContain("inflamação aguda");
    expect(texto).not.toContain("Jose Antonio da Conceicao");
    expect(texto).not.toContain("Clinica Sorriso");
    expect(texto).not.toContain("pos-procedimento");
  });

  it("preserva acentos no PDF da receita", async () => {
    const receita = Receita.emitir({
      id: "rec-acentos",
      clinicaId: "clin-1",
      prontuarioId: "pront-1",
      profissionalId: "prof-1",
      itens: [
        {
          medicamento: "Amoxicilina",
          dosagem: "500 mg",
          posologia: "1 cápsula a cada 8 horas",
          duracao: "7 dias",
        },
      ],
      cabecalho: cabecalhoAcentuado,
      emitidaEm: new Date("2026-08-11T15:00:00.000Z"),
    });

    const bytes = await new PdfLibGeradorPdfPort().gerar(receita);
    const texto = await textoDoPdf(bytes);

    expect(texto).toContain("José Antônio da Conceição");
    expect(texto).toContain("1 cápsula a cada 8 horas");
    expect(texto).toContain("RECEITUÁRIO ODONTOLÓGICO");
  });

  it("preserva acentos portugueses no PDF do orçamento (nome, clínica, item)", async () => {
    const { Orcamento } = await import("@/core/orcamento/domain/Orcamento");
    const orcamento = Orcamento.emitir({
      id: "orc-acentos",
      clinicaId: "clin-1",
      prontuarioId: "pront-1",
      profissionalId: "prof-1",
      itens: [
        {
          procedimentoId: "proc-1",
          nome: "Clareamento dentário — sessão única".normalize("NFD"),
          valor: 850,
          quantidade: 1,
        },
      ],
      cabecalho: cabecalhoAcentuado,
      validoAte: new Date("2026-09-30T00:00:00.000Z"),
      emitidoEm: new Date("2026-08-12T15:00:00.000Z"),
    });

    const bytes = await new PdfLibGeradorPdfPort().gerarOrcamento(orcamento);
    const texto = await textoDoPdf(bytes);

    expect(texto).toContain("José Antônio da Conceição");
    expect(texto).toContain("Clínica Sorriso");
    expect(texto).toContain("São Paulo");
    expect(texto).toContain("Márcia Gonçalves");
    expect(texto).toContain("Clareamento dentário");
    expect(texto).toContain("Válido até");
    expect(texto).toContain("ORÇAMENTO ODONTOLÓGICO");
    expect(texto).not.toContain("Jose Antonio da Conceicao");
    expect(texto).not.toContain("Clinica Sorriso");
  });
});
