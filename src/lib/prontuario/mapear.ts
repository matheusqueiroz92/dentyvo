import type { Anamnese } from "@/core/anamnese/domain/Anamnese";
import type { Evolucao } from "@/core/prontuario/domain/Evolucao";
import type { Prontuario } from "@/core/prontuario/domain/Prontuario";

import type {
  AnamneseDTO,
  EvolucaoDTO,
  ProntuarioDTO,
  RespostasAnamneseDTO,
} from "./types";

export function prontuarioParaDto(prontuario: Prontuario): ProntuarioDTO {
  return {
    id: prontuario.id,
    pacienteId: prontuario.pacienteId,
    criadoEmIso: prontuario.criadoEm.toISOString(),
  };
}

export function anamneseParaDto(
  anamnese: Anamnese,
  preenchidoPorNome: string,
): AnamneseDTO {
  const props = anamnese.respostas.toProps();
  const respostas: RespostasAnamneseDTO = {
    historicoMedico: props.historicoMedico,
    alergias: props.alergias,
    medicacoesEmUso: props.medicacoesEmUso,
    condicoesPreexistentes: props.condicoesPreexistentes,
  };

  return {
    id: anamnese.id,
    prontuarioId: anamnese.prontuarioId,
    versao: anamnese.versao,
    respostas,
    preenchidoEmIso: anamnese.preenchidoEm.toISOString(),
    preenchidoPorProfissionalId: anamnese.preenchidoPorProfissionalId,
    preenchidoPorNome,
  };
}

export function evolucaoParaDto(
  evolucao: Evolucao,
  opts: {
    profissionalNome: string;
    procedimentoNome: string | null;
    jaRetificada: boolean;
  },
): EvolucaoDTO {
  return {
    id: evolucao.id,
    prontuarioId: evolucao.prontuarioId,
    profissionalId: evolucao.profissionalId,
    profissionalNome: opts.profissionalNome,
    tipo: evolucao.tipo,
    descricao: evolucao.descricao,
    registradoEmIso: evolucao.registradoEm.toISOString(),
    procedimentoId: evolucao.procedimentoId,
    procedimentoNome: opts.procedimentoNome,
    evolucaoRetificadaId: evolucao.evolucaoRetificadaId,
    motivoRetificacao: evolucao.motivoRetificacao,
    jaRetificada: opts.jaRetificada,
  };
}

/** Ordena registros (mais recente → antigo) e anexa retificação encadeada. */
export function montarTimelineEvolucoes(
  evolucoes: EvolucaoDTO[],
): Array<{ registro: EvolucaoDTO; retificacao: EvolucaoDTO | null }> {
  const retificacoes = evolucoes.filter((e) => e.tipo === "retificacao");
  const porOriginal = new Map(
    retificacoes
      .filter((r) => r.evolucaoRetificadaId)
      .map((r) => [r.evolucaoRetificadaId as string, r]),
  );

  return evolucoes
    .filter((e) => e.tipo === "registro")
    .slice()
    .sort(
      (a, b) =>
        new Date(b.registradoEmIso).getTime() -
        new Date(a.registradoEmIso).getTime(),
    )
    .map((registro) => ({
      registro,
      retificacao: porOriginal.get(registro.id) ?? null,
    }));
}
