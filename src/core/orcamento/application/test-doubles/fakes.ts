import type { GeradorPdfPort } from "@/core/receituario/application/ports/GeradorPdfPort";
import type { Receita } from "@/core/receituario/domain/Receita";
import type { Atestado } from "@/core/atestado/domain/Atestado";
import type { SnapshotCabecalhoDocumentoProps } from "@/core/shared/SnapshotCabecalhoDocumento";

import type { Orcamento } from "../../domain/Orcamento";
import { OrcamentoStatusConflitoError } from "../../domain/errors";
import type { OrcamentoRepositoryPort } from "../ports/OrcamentoRepositoryPort";

/**
 * Fake com UPDATE condicional de status (contrato da port):
 * só persiste se o registro em memória ainda está `enviado`.
 * `conflitoNaProximaAtualizacao` força 0 linhas afetadas (corrida).
 */
export class FakeOrcamentoRepository implements OrcamentoRepositoryPort {
  readonly items = new Map<string, Orcamento>();

  /**
   * Simula corrida TOCTOU: próxima `atualizarStatus` lança
   * `OrcamentoStatusConflitoError` mesmo com registro `enviado` em memória.
   */
  conflitoNaProximaAtualizacao = false;

  async salvar(orcamento: Orcamento): Promise<void> {
    this.items.set(orcamento.id, orcamento);
  }

  async atualizarStatus(orcamento: Orcamento): Promise<void> {
    if (this.conflitoNaProximaAtualizacao) {
      this.conflitoNaProximaAtualizacao = false;
      throw new OrcamentoStatusConflitoError(orcamento.id);
    }

    const atual = this.items.get(orcamento.id);
    if (
      !atual ||
      atual.clinicaId !== orcamento.clinicaId ||
      atual.status !== "enviado"
    ) {
      throw new OrcamentoStatusConflitoError(orcamento.id);
    }

    this.items.set(orcamento.id, orcamento);
  }

  async buscarPorId(
    clinicaId: string,
    orcamentoId: string,
  ): Promise<Orcamento | null> {
    const encontrado = this.items.get(orcamentoId);
    if (!encontrado || encontrado.clinicaId !== clinicaId) return null;
    return encontrado;
  }

  async listarPorProntuario(
    clinicaId: string,
    prontuarioId: string,
  ): Promise<Orcamento[]> {
    return [...this.items.values()]
      .filter(
        (o) => o.clinicaId === clinicaId && o.prontuarioId === prontuarioId,
      )
      .sort((a, b) => b.emitidoEm.getTime() - a.emitidoEm.getTime());
  }
}

/**
 * Fake da `GeradorPdfPort` do receituário, com registro de orçamentos
 * (spec 015). Demais métodos existem só para satisfazer a interface.
 */
export class FakeGeradorPdfPort implements GeradorPdfPort {
  readonly geracoesOrcamento: Orcamento[] = [];
  bytesGerados = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF

  async gerar(receita: Receita): Promise<Uint8Array> {
    void receita;
    throw new Error("gerar receita não é usado nos testes de orçamento.");
  }

  async gerarAtestado(atestado: Atestado): Promise<Uint8Array> {
    void atestado;
    throw new Error("gerarAtestado não é usado nos testes de orçamento.");
  }

  async gerarOrcamento(orcamento: Orcamento): Promise<Uint8Array> {
    this.geracoesOrcamento.push(orcamento);
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
