import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import type { Atestado } from "@/core/atestado/domain/Atestado";
import type { SnapshotCabecalhoDocumento } from "@/core/shared/SnapshotCabecalhoDocumento";

import type { GeradorPdfPort } from "../../application/ports/GeradorPdfPort";
import type { Receita } from "../../domain/Receita";

type DrawTexto = (
  texto: string,
  opts?: { size?: number; bold?: boolean; gap?: number },
) => void;

/**
 * Gera PDF sob demanda com pdf-lib a partir do snapshot (specs 006 / 006b).
 * Sem Chromium; sem persistência de blob.
 */
export class PdfLibGeradorPdfPort implements GeradorPdfPort {
  async gerar(receita: Receita): Promise<Uint8Array> {
    const { pdfDoc, draw } = await criarPagina();
    const cab = receita.cabecalho;

    desenharCabecalho(draw, cab, "RECEITUARIO ODONTOLOGICO");
    draw(`Emitida em: ${formatarDataHora(receita.emitidaEm)}`, {
      size: 11,
      gap: 20,
    });

    draw("Prescricao", { size: 13, bold: true, gap: 16 });

    receita.itens.forEach((item, index) => {
      draw(`${index + 1}. ${item.medicamento}`, { size: 11, bold: true });
      draw(`   Dosagem: ${item.dosagem}`, { size: 10 });
      draw(`   Posologia: ${item.posologia}`, { size: 10 });
      draw(`   Duracao: ${item.duracao}`, { size: 10, gap: 14 });
    });

    desenharRodapeAssinatura(draw);
    return pdfDoc.save();
  }

  async gerarAtestado(atestado: Atestado): Promise<Uint8Array> {
    const { pdfDoc, draw } = await criarPagina();
    const cab = atestado.cabecalho;

    desenharCabecalho(draw, cab, "ATESTADO ODONTOLOGICO");
    draw(`Emitido em: ${formatarDataHora(atestado.emitidaEm)}`, {
      size: 11,
      gap: 20,
    });

    draw("Motivo / finalidade", { size: 13, bold: true, gap: 16 });
    draw(atestado.motivo, { size: 11, gap: 14 });

    if (atestado.cid) {
      draw(`CID: ${atestado.cid}`, { size: 11, gap: 14 });
    }

    draw("Periodo de afastamento", { size: 13, bold: true, gap: 16 });
    draw(
      `${formatarData(atestado.dataInicio)} a ${formatarData(atestado.dataFim)} (${atestado.quantidadeDias} dia(s))`,
      { size: 11, gap: 14 },
    );

    desenharRodapeAssinatura(draw);
    return pdfDoc.save();
  }
}

async function criarPagina(): Promise<{
  pdfDoc: PDFDocument;
  draw: DrawTexto;
}> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const margin = 50;
  let y = height - margin;

  const draw: DrawTexto = (texto, opts) => {
    const size = opts?.size ?? 11;
    const used = opts?.bold ? fontBold : font;
    page.drawText(paraWinAnsi(texto), {
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
  draw("(Assinatura digital com validade juridica fora do MVP)", {
    size: 9,
  });
}

/** Helvetica (WinAnsi) não cobre acentos — NFD remove o diacrítico. */
function paraWinAnsi(texto: string): string {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
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
