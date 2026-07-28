import { Agendamento } from "../../domain/Agendamento";
import type { DisponibilidadeProfissional } from "../../domain/DisponibilidadeProfissional";
import { intervalosSobrepoem } from "../../domain/intervalo";
import type { Procedimento } from "../../domain/Procedimento";
import { SobreposicaoHorarioError } from "../../domain/errors";
import type { AgendamentoRepositoryPort } from "../ports/AgendamentoRepositoryPort";
import type { DisponibilidadeProfissionalRepositoryPort } from "../ports/DisponibilidadeProfissionalRepositoryPort";
import type {
  IntencaoLembrete,
  LembretePort,
} from "../ports/LembretePort";
import type { ProcedimentoRepositoryPort } from "../ports/ProcedimentoRepositoryPort";

export class FakeAgendamentoRepository implements AgendamentoRepositoryPort {
  readonly items = new Map<string, Agendamento>();

  async salvarOcupandoSlot(agendamento: Agendamento): Promise<void> {
    this.assertSemSobreposicao(agendamento);
    this.items.set(agendamento.id, agendamento);
  }

  async remarcarAtomicamente(
    anterior: Agendamento,
    atualizado: Agendamento,
  ): Promise<void> {
    if (anterior.id !== atualizado.id) {
      throw new Error("Remarcação deve preservar o id do agendamento.");
    }
    this.items.delete(anterior.id);
    this.assertSemSobreposicao(atualizado);
    this.items.set(atualizado.id, atualizado);
  }

  async salvar(agendamento: Agendamento): Promise<void> {
    this.items.set(agendamento.id, agendamento);
  }

  async buscarPorId(
    clinicaId: string,
    agendamentoId: string,
  ): Promise<Agendamento | null> {
    const encontrado = this.items.get(agendamentoId);
    if (!encontrado || encontrado.clinicaId !== clinicaId) return null;
    return encontrado;
  }

  async listarOcupadosPorProfissionalNoIntervalo(
    clinicaId: string,
    profissionalId: string,
    inicio: Date,
    fim: Date,
  ): Promise<Agendamento[]> {
    return [...this.items.values()].filter(
      (a) =>
        a.clinicaId === clinicaId &&
        a.profissionalId === profissionalId &&
        a.ocupaSlot() &&
        intervalosSobrepoem(a.dataHoraInicio, a.dataHoraFim, inicio, fim),
    );
  }

  private assertSemSobreposicao(candidato: Agendamento): void {
    for (const existente of this.items.values()) {
      if (existente.id === candidato.id) continue;
      if (
        existente.clinicaId === candidato.clinicaId &&
        candidato.sobrepoe(existente)
      ) {
        throw new SobreposicaoHorarioError(
          candidato.profissionalId,
          candidato.dataHoraInicio,
          candidato.dataHoraFim,
        );
      }
    }
  }
}

export class FakeDisponibilidadeRepository
  implements DisponibilidadeProfissionalRepositoryPort
{
  readonly porProfissional = new Map<string, DisponibilidadeProfissional[]>();

  async substituirJanelas(
    clinicaId: string,
    profissionalId: string,
    janelas: DisponibilidadeProfissional[],
  ): Promise<void> {
    const filtradas = janelas.filter(
      (j) => j.clinicaId === clinicaId && j.profissionalId === profissionalId,
    );
    this.porProfissional.set(chave(clinicaId, profissionalId), filtradas);
  }

  async listarPorProfissional(
    clinicaId: string,
    profissionalId: string,
  ): Promise<DisponibilidadeProfissional[]> {
    return this.porProfissional.get(chave(clinicaId, profissionalId)) ?? [];
  }
}

export class FakeProcedimentoRepository implements ProcedimentoRepositoryPort {
  readonly items = new Map<string, Procedimento>();

  async salvar(procedimento: Procedimento): Promise<void> {
    this.items.set(procedimento.id, procedimento);
  }

  async buscarPorId(
    clinicaId: string,
    procedimentoId: string,
  ): Promise<Procedimento | null> {
    const encontrado = this.items.get(procedimentoId);
    if (!encontrado || encontrado.clinicaId !== clinicaId) return null;
    return encontrado;
  }

  async listarPorClinica(clinicaId: string): Promise<Procedimento[]> {
    return [...this.items.values()].filter((p) => p.clinicaId === clinicaId);
  }
}

export class FakeLembretePort implements LembretePort {
  readonly intencoes: IntencaoLembrete[] = [];
  falharProximo = false;

  async registrarIntencao(intencao: IntencaoLembrete): Promise<void> {
    if (this.falharProximo) {
      this.falharProximo = false;
      throw new Error("falha ao registrar lembrete");
    }
    this.intencoes.push(intencao);
  }
}

function chave(clinicaId: string, profissionalId: string): string {
  return `${clinicaId}::${profissionalId}`;
}
