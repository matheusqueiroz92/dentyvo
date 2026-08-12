import type { Orcamento } from "@/core/orcamento/domain/Orcamento";
import type { GeradorPdfPort } from "@/core/receituario/application/ports/GeradorPdfPort";
import type { Receita } from "@/core/receituario/domain/Receita";
import type { SnapshotCabecalhoDocumentoProps } from "@/core/shared/SnapshotCabecalhoDocumento";

import type { Atestado } from "../../domain/Atestado";
import type { AtestadoRepositoryPort } from "../ports/AtestadoRepositoryPort";

export class FakeAtestadoRepository implements AtestadoRepositoryPort {
  readonly items = new Map<string, Atestado>();

  async salvar(atestado: Atestado): Promise<void> {
    this.items.set(atestado.id, atestado);
  }

  async buscarPorId(
    clinicaId: string,
    atestadoId: string,
  ): Promise<Atestado | null> {
    const encontrada = this.items.get(atestadoId);
    if (!encontrada || encontrada.clinicaId !== clinicaId) return null;
    return encontrada;
  }

  async listarPorProntuario(
    clinicaId: string,
    prontuarioId: string,
  ): Promise<Atestado[]> {
    return [...this.items.values()]
      .filter(
        (a) => a.clinicaId === clinicaId && a.prontuarioId === prontuarioId,
      )
      .sort((a, b) => b.emitidaEm.getTime() - a.emitidaEm.getTime());
  }
}

/**
 * Fake da `GeradorPdfPort` do receituário, com registro de atestados
 * (spec 006b). `gerar` de receita existe só para satisfazer a interface.
 */
export class FakeGeradorPdfPort implements GeradorPdfPort {
  readonly geracoesAtestado: Atestado[] = [];
  bytesGerados = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF

  async gerar(receita: Receita): Promise<Uint8Array> {
    void receita;
    throw new Error("gerar receita não é usado nos testes de atestado.");
  }

  async gerarAtestado(atestado: Atestado): Promise<Uint8Array> {
    this.geracoesAtestado.push(atestado);
    return this.bytesGerados;
  }

  /** Satisfaz a interface; testes de atestado não exercitam este método. */
  async gerarOrcamento(orcamento: Orcamento): Promise<Uint8Array> {
    void orcamento;
    return this.bytesGerados;
  }
}

export const cabecalhoValido: SnapshotCabecalhoDocumentoProps = {
  clinicaNome: "Clínica Sorriso",
  clinicaEndereco: "Rua A, 100",
  profissionalNome: "Dra. Ana",
  profissionalCro: "12345",
  pacienteNome: "Ana Paciente",
  pacienteCpf: "39053344705",
  pacienteDataNascimento: new Date("1990-05-15T12:00:00.000Z"),
  profissionalEspecialidade: "Ortodontia",
};
