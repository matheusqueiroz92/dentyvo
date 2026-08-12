/**
 * Gera PDF de orçamento com acentos, extrai texto (pdfjs) e grava em disco.
 * Uso: npx tsx scripts/verificar-pdf-orcamento-acentos.ts
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { Orcamento } from "../src/core/orcamento/domain/Orcamento";
import { PdfLibGeradorPdfPort } from "../src/core/receituario/infra/adapters/PdfLibGeradorPdfPort";

async function textoDoPdf(bytes: Uint8Array): Promise<string> {
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const pdf = await getDocument({ data: bytes }).promise;
  const page = await pdf.getPage(1);
  const content = await page.getTextContent();
  return content.items
    .map((item) => ("str" in item ? item.str : ""))
    .join(" ");
}

const cabecalho = {
  clinicaNome: "Clínica Sorriso & Saúde",
  clinicaEndereco: "Rua José de Alencar, 100 — Centro, São Paulo",
  profissionalNome: "Dra. Márcia Gonçalves",
  profissionalCro: "SP-12345",
  pacienteNome: "José Antônio da Conceição",
  pacienteCpf: "529.982.247-25",
  pacienteDataNascimento: new Date("1990-05-15T00:00:00.000Z"),
  profissionalEspecialidade: "Endodontia",
};

async function main() {
  const orcamento = Orcamento.emitir({
    id: "orc-acentos-visual",
    clinicaId: "clin-1",
    prontuarioId: "pront-1",
    profissionalId: "prof-1",
    itens: [
      {
        procedimentoId: "proc-1",
        nome: "Clareamento dentário — sessão única",
        valor: 850,
        quantidade: 1,
      },
      {
        procedimentoId: "proc-2",
        nome: "Restauração em resina — molar",
        valor: 320.5,
        quantidade: 2,
      },
    ],
    cabecalho,
    validoAte: new Date("2026-09-30T00:00:00.000Z"),
    emitidoEm: new Date("2026-08-12T15:00:00.000Z"),
  });

  const bytes = await new PdfLibGeradorPdfPort().gerarOrcamento(orcamento);
  const out = join(process.cwd(), "tmp-orcamento-acentos.pdf");
  writeFileSync(out, Buffer.from(bytes));

  const texto = await textoDoPdf(bytes);
  const checks = [
    "José Antônio da Conceição",
    "Clínica Sorriso",
    "São Paulo",
    "Márcia Gonçalves",
    "Clareamento dentário",
    "Válido até",
    "ORÇAMENTO ODONTOLÓGICO",
  ];

  console.log(`PDF gravado em: ${out}`);
  for (const trecho of checks) {
    const ok = texto.includes(trecho);
    console.log(`${ok ? "OK" : "FALHA"}: "${trecho}"`);
    if (!ok) process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
