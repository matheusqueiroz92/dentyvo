import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";
import { ProfissionalNaoEncontradoError } from "@/core/auth/domain/errors";

import type { HorarioDisponivel } from "../../domain/DisponibilidadeProfissional";
import { horaParaMinutos } from "../../domain/DisponibilidadeProfissional";
import { intervalosSobrepoem } from "../../domain/intervalo";
import type { AgendamentoRepositoryPort } from "../ports/AgendamentoRepositoryPort";
import type { DisponibilidadeProfissionalRepositoryPort } from "../ports/DisponibilidadeProfissionalRepositoryPort";
import {
  diaDaSemanaNoTimezone,
  instanteNoTimezone,
  partesDataNoTimezone,
} from "./helpers";

/** Duração padrão dos slots listados (alinha aos testes / uso clínico comum). */
export const SLOT_LISTAGEM_MINUTOS = 60;

export type ListarHorariosDisponiveisCoreInput = {
  clinicaId: string;
  profissionalId: string;
  /** Dia civil no timezone operacional (hora local irrelevante; usa-se a data). */
  data: Date;
};

/**
 * Núcleo de listagem de slots — sem RBAC / sessão.
 * Usado pelo painel autenticado e pelo canal `link-publico`.
 */
export class ListarHorariosDisponiveisCore {
  constructor(
    private readonly disponibilidadeRepo: DisponibilidadeProfissionalRepositoryPort,
    private readonly agendamentoRepo: AgendamentoRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
  ) {}

  async executar(
    input: ListarHorariosDisponiveisCoreInput,
  ): Promise<HorarioDisponivel[]> {
    const profissional = await this.profissionalRepo.buscarPorId(
      input.clinicaId,
      input.profissionalId,
    );
    if (!profissional) {
      throw new ProfissionalNaoEncontradoError(input.profissionalId);
    }

    const diaSemana = diaDaSemanaNoTimezone(input.data);
    const { ano, mes, dia } = partesDataNoTimezone(input.data);

    const janelas = (
      await this.disponibilidadeRepo.listarPorProfissional(
        input.clinicaId,
        input.profissionalId,
      )
    ).filter((j) => j.diaDaSemana === diaSemana);

    const inicioDia = instanteNoTimezone(ano, mes, dia, 0);
    const fimDia = instanteNoTimezone(ano, mes, dia, 24 * 60);
    const ocupados =
      await this.agendamentoRepo.listarOcupadosPorProfissionalNoIntervalo(
        input.clinicaId,
        input.profissionalId,
        inicioDia,
        fimDia,
      );

    const horarios: HorarioDisponivel[] = [];
    for (const janela of janelas) {
      const inicioJanela = horaParaMinutos(janela.horaInicio);
      const fimJanela = horaParaMinutos(janela.horaFim);
      for (
        let inicio = inicioJanela;
        inicio + SLOT_LISTAGEM_MINUTOS <= fimJanela;
        inicio += SLOT_LISTAGEM_MINUTOS
      ) {
        const fim = inicio + SLOT_LISTAGEM_MINUTOS;
        const slotInicio = instanteNoTimezone(ano, mes, dia, inicio);
        const slotFim = instanteNoTimezone(ano, mes, dia, fim);
        const conflita = ocupados.some((a) =>
          intervalosSobrepoem(
            a.dataHoraInicio,
            a.dataHoraFim,
            slotInicio,
            slotFim,
          ),
        );
        if (!conflita) {
          horarios.push({ inicio: slotInicio, fim: slotFim });
        }
      }
    }

    horarios.sort((a, b) => a.inicio.getTime() - b.inicio.getTime());
    return horarios;
  }
}
