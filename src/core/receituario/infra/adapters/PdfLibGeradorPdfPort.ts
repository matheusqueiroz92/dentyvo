import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import type { GeradorPdfPort } from "../../application/ports/GeradorPdfPort";
import type { Receita } from "../../domain/Receita";

/**
 * Gera PDF sob demanda com pdf-lib a partir do snapshot + itens (spec 006).
 * Sem Chromium; sem persistência de blob.
 */
export class PdfLibGeradorPdfPort implements GeradorPdfPort {
  async gerar(receita: Receita): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    const margin = 50;
    let y = height - margin;

    const draw = (
      texto: string,
      opts?: { size?: number; bold?: boolean; gap?: number },
    ) => {
      const size = opts?.size ?? 11;
      const used = opts?.bold ? fontBold : font;
      page.drawText(texto, {
        x: margin,
        y,
        size,
        font: used,
        color: rgb(0.1, 0.1, 0.1),
        maxWidth: width - margin * 2,
      });
      y -= opts?.gap ?? size + 6;
    };

    const cab = receita.cabecalho;

    draw(cab.clinicaNome, { size: 16, bold: true, gap: 18 });
    draw(cab.clinicaEndereco, { size: 10, gap: 16 });
    draw("RECEITUARIO ODONTOLOGICO", { size: 14, bold: true, gap: 20 });

    draw(`Profissional: ${cab.profissionalNome}`, { size: 11 });
    draw(`CRO: ${cab.profissionalCro}`, { size: 11 });
    if (cab.profissionalEspecialidade) {
      draw(`Especialidade: ${cab.profissionalEspecialidade}`, { size: 11 });
    }
    y -= 8;

    draw(`Paciente: ${cab.pacienteNome}`, { size: 11 });
    draw(`CPF: ${cab.pacienteCpf}`, { size: 11 });
    if (cab.pacienteDataNascimento) {
      draw(
        `Data de nascimento: ${formatarData(cab.pacienteDataNascimento)}`,
        { size: 11 },
      );
    }
    y -= 8;

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

    y -= 24;
    draw("Assinatura do profissional: _______________________________", {
      size: 10,
      gap: 14,
    });
    draw("(Assinatura digital com validade juridica fora do MVP)", {
      size: 9,
    });

    const bytes = await pdfDoc.save();
    return bytes;
  }
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
