import { readFileSync } from "node:fs";
import { join } from "node:path";

import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont } from "pdf-lib";

import type { Atestado } from "@/core/atestado/domain/Atestado";
import type { Orcamento } from "@/core/orcamento/domain/Orcamento";
import type { SnapshotCabecalhoDocumento } from "@/core/shared/SnapshotCabecalhoDocumento";

import type { GeradorPdfPort } from "../../application/ports/GeradorPdfPort";
import type { Receita } from "../../domain/Receita";

type DrawTexto = (
  texto: string,
  opts?: { size?: number; bold?: boolean; gap?: number },
) => void;

type FontesInter = {
  regular: PDFFont;
  bold: PDFFont;
};

let cacheBytes: { regular: Buffer; bold: Buffer } | null = null;

/**
 * Gera PDF sob demanda com pdf-lib + Inter embutida (specs 006 / 006b).
 * Sem Chromium; sem persistência de blob.
 *
 * Helvetica/WinAnsi falha com acentos em forma NFD (marca combinante U+0301).
 * Inter via fontkit preserva á é í ó ú ã õ ç â ê ô etc.
 */
export class PdfLibGeradorPdfPort implements GeradorPdfPort {
  async gerar(receita: Receita): Promise<Uint8Array> {
    const { pdfDoc, draw } = await criarPagina();
    const cab = receita.cabecalho;

    desenharCabecalho(draw, cab, "RECEITUÁRIO ODONTOLÓGICO");
    draw(`Emitida em: ${formatarDataHora(receita.emitidaEm)}`, {
      size: 11,
      gap: 20,
    });

    draw("Prescrição", { size: 13, bold: true, gap: 16 });

    receita.itens.forEach((item, index) => {
      draw(`${index + 1}. ${item.medicamento}`, { size: 11, bold: true });
      draw(`   Dosagem: ${item.dosagem}`, { size: 10 });
      draw(`   Posologia: ${item.posologia}`, { size: 10 });
      draw(`   Duração: ${item.duracao}`, { size: 10, gap: 14 });
    });

    desenharRodapeAssinatura(draw);
    return pdfDoc.save();
  }

  async gerarAtestado(atestado: Atestado): Promise<Uint8Array> {
    const { pdfDoc, draw } = await criarPagina();
    const cab = atestado.cabecalho;

    desenharCabecalho(draw, cab, "ATESTADO ODONTOLÓGICO");
    draw(`Emitido em: ${formatarDataHora(atestado.emitidaEm)}`, {
      size: 11,
      gap: 20,
    });

    draw("Motivo / finalidade", { size: 13, bold: true, gap: 16 });
    draw(atestado.motivo, { size: 11, gap: 14 });

    if (atestado.cid) {
      draw(`CID: ${atestado.cid}`, { size: 11, gap: 14 });
    }

    draw("Período de afastamento", { size: 13, bold: true, gap: 16 });
    draw(
      `${formatarData(atestado.dataInicio)} a ${formatarData(atestado.dataFim)} (${atestado.quantidadeDias} dia(s))`,
      { size: 11, gap: 14 },
    );

    desenharRodapeAssinatura(draw);
    return pdfDoc.save();
  }

  async gerarOrcamento(orcamento: Orcamento): Promise<Uint8Array> {
    const { pdfDoc, draw } = await criarPagina();
    const cab = orcamento.cabecalho;

    desenharCabecalho(draw, cab, "ORÇAMENTO ODONTOLÓGICO");
    draw(`Emitido em: ${formatarDataHora(orcamento.emitidoEm)}`, {
      size: 11,
      gap: 12,
    });
    draw(`Status: ${rotuloStatus(orcamento.status)}`, {
      size: 11,
      gap: orcamento.validoAte ? 12 : 20,
    });
    if (orcamento.validoAte) {
      draw(`Válido até: ${formatarData(orcamento.validoAte)}`, {
        size: 11,
        gap: 20,
      });
    }

    draw("Itens", { size: 13, bold: true, gap: 16 });

    orcamento.itens.forEach((item, index) => {
      draw(`${index + 1}. ${item.nome}`, { size: 11, bold: true });
      draw(
        `   Qtd: ${item.quantidade}  ·  Valor unit.: ${formatarMoeda(item.valor)}  ·  Subtotal: ${formatarMoeda(item.subtotal)}`,
        { size: 10, gap: 14 },
      );
    });

    draw(`Total: ${formatarMoeda(orcamento.total)}`, {
      size: 12,
      bold: true,
      gap: 20,
    });

    desenharRodapeAssinatura(draw);
    return pdfDoc.save();
  }
}

function rotuloStatus(status: Orcamento["status"]): string {
  switch (status) {
    case "enviado":
      return "Enviado";
    case "aceito":
      return "Aceito";
    case "recusado":
      return "Recusado";
  }
}

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

async function criarPagina(): Promise<{
  pdfDoc: PDFDocument;
  draw: DrawTexto;
}> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const fontes = await embutirInter(pdfDoc);
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const margin = 50;
  let y = height - margin;

  const draw: DrawTexto = (texto, opts) => {
    const size = opts?.size ?? 11;
    const used = opts?.bold ? fontes.bold : fontes.regular;
    page.drawText(normalizarTextoPdf(texto), {
      x: margin,
      y,
      size,
      font: used,
      color: rgb(0.1, 0.1, 0.1),
      maxWidth: width - margin * 2,
    });
    y -= opts?.gap ?? size + 6;
  };

  return { pdfDoc, draw };
}

async function embutirInter(pdfDoc: PDFDocument): Promise<FontesInter> {
  const bytes = carregarBytesInter();
  const [regular, bold] = await Promise.all([
    pdfDoc.embedFont(bytes.regular, { subset: true }),
    pdfDoc.embedFont(bytes.bold, { subset: true }),
  ]);
  return { regular, bold };
}

function carregarBytesInter(): { regular: Buffer; bold: Buffer } {
  if (cacheBytes) return cacheBytes;
  const dir = join(process.cwd(), "assets", "fonts");
  cacheBytes = {
    regular: readFileSync(join(dir, "Inter-Regular.ttf")),
    bold: readFileSync(join(dir, "Inter-Bold.ttf")),
  };
  return cacheBytes;
}

function desenharCabecalho(
  draw: DrawTexto,
  cab: SnapshotCabecalhoDocumento,
  titulo: string,
): void {
  draw(cab.clinicaNome, { size: 16, bold: true, gap: 18 });
  draw(cab.clinicaEndereco, { size: 10, gap: 16 });
  draw(titulo, { size: 14, bold: true, gap: 20 });

  draw(`Profissional: ${cab.profissionalNome}`, { size: 11 });
  draw(`CRO: ${cab.profissionalCro}`, {
    size: 11,
    gap: cab.profissionalEspecialidade ? 17 : 25,
  });
  if (cab.profissionalEspecialidade) {
    draw(`Especialidade: ${cab.profissionalEspecialidade}`, {
      size: 11,
      gap: 25,
    });
  }

  draw(`Paciente: ${cab.pacienteNome}`, { size: 11 });
  draw(`CPF: ${cab.pacienteCpf}`, {
    size: 11,
    gap: cab.pacienteDataNascimento ? 17 : 25,
  });
  if (cab.pacienteDataNascimento) {
    draw(`Data de nascimento: ${formatarData(cab.pacienteDataNascimento)}`, {
      size: 11,
      gap: 25,
    });
  }
}

function desenharRodapeAssinatura(draw: DrawTexto): void {
  draw(" ", { size: 8, gap: 24 });
  draw("Assinatura do profissional: _______________________________", {
    size: 10,
    gap: 14,
  });
  draw("(Assinatura digital com validade jurídica fora do MVP)", {
    size: 9,
  });
}

/**
 * NFC recompõe acentos (evita U+0301 solto de NFD).
 * Pontuação tipográfica fora do núcleo PT-BR → equivalentes ASCII
 * (aspas retas, hífen, reticências), sem remover diacríticos.
 */
export function normalizarTextoPdf(texto: string): string {
  return texto
    .normalize("NFC")
    .replace(/[\u201C\u201D\u00AB\u00BB]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...");
}

function formatarData(data: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(data);
}

function formatarDataHora(data: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(data);
}
