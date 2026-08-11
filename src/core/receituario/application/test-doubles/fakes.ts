import type { Atestado } from "@/core/atestado/domain/Atestado";

import type { ItemReceitaProps } from "../../domain/ItemReceita";
import type { Receita } from "../../domain/Receita";
import type { SnapshotCabecalhoReceitaProps } from "../../domain/SnapshotCabecalhoReceita";
import type { GeradorPdfPort } from "../ports/GeradorPdfPort";
import type { ReceitaRepositoryPort } from "../ports/ReceitaRepositoryPort";

export class FakeReceitaRepository implements ReceitaRepositoryPort {
  readonly items = new Map<string, Receita>();

  async salvar(receita: Receita): Promise<void> {
    this.items.set(receita.id, receita);
  }

  async buscarPorId(
    clinicaId: string,
    receitaId: string,
  ): Promise<Receita | null> {
    const encontrada = this.items.get(receitaId);
    if (!encontrada || encontrada.clinicaId !== clinicaId) return null;
    return encontrada;
  }

  async listarPorProntuario(
    clinicaId: string,
    prontuarioId: string,
  ): Promise<Receita[]> {
    return [...this.items.values()]
      .filter(
        (r) => r.clinicaId === clinicaId && r.prontuarioId === prontuarioId,
      )
      .sort((a, b) => b.emitidaEm.getTime() - a.emitidaEm.getTime());
  }
}

/**
 * Fake de PDF: devolve bytes fixos e registra a receita recebida
 * (para assertir snapshot, sem persistir blob).
 */
export class FakeGeradorPdfPort implements GeradorPdfPort {
  readonly geracoes: Receita[] = [];
  bytesGerados = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF

  async gerar(receita: Receita): Promise<Uint8Array> {
    this.geracoes.push(receita);
    return this.bytesGerados;
  }

  /** Satisfaz a interface; testes de receita não exercitam este método. */
  async gerarAtestado(atestado: Atestado): Promise<Uint8Array> {
    void atestado;
    return this.bytesGerados;
  }
}

export const itemReceitaValido: ItemReceitaProps = {
  medicamento: "Amoxicilina",
  dosagem: "500 mg",
  posologia: "1 comprimido de 8/8h",
  duracao: "7 dias",
};

export const cabecalhoValido: SnapshotCabecalhoReceitaProps = {
  clinicaNome: "Clínica Sorriso",
  clinicaEndereco: "Rua A, 100",
  profissionalNome: "Dra. Ana",
  profissionalCro: "12345",
  pacienteNome: "Ana Paciente",
  pacienteCpf: "39053344705",
  pacienteDataNascimento: new Date("1990-05-15T12:00:00.000Z"),
  profissionalEspecialidade: "Ortodontia",
};
