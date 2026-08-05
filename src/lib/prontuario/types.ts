export type SecaoAnamneseDTO = {
  texto: string | null;
  negado: boolean;
};

export type RespostasAnamneseDTO = {
  historicoMedico: SecaoAnamneseDTO;
  alergias: SecaoAnamneseDTO;
  medicacoesEmUso: SecaoAnamneseDTO;
  condicoesPreexistentes: SecaoAnamneseDTO;
};

export type AnamneseDTO = {
  id: string;
  prontuarioId: string;
  versao: number;
  respostas: RespostasAnamneseDTO;
  preenchidoEmIso: string;
  preenchidoPorProfissionalId: string;
  preenchidoPorNome: string;
};

export type ProntuarioDTO = {
  id: string;
  pacienteId: string;
  criadoEmIso: string;
};

export type EvolucaoDTO = {
  id: string;
  prontuarioId: string;
  profissionalId: string;
  profissionalNome: string;
  tipo: "registro" | "retificacao";
  descricao: string;
  registradoEmIso: string;
  procedimentoId: string | null;
  procedimentoNome: string | null;
  evolucaoRetificadaId: string | null;
  motivoRetificacao: string | null;
  /** Só para tipo registro: já existe retificação vinculada. */
  jaRetificada: boolean;
};

export type ProcedimentoOpcaoDTO = {
  id: string;
  label: string;
};

/** Resultado da carga da aba Prontuário (após ConsultarProntuario quando existe). */
export type ProntuarioTabDTO =
  | { status: "sem_prontuario" }
  | {
      status: "prontuario";
      prontuario: ProntuarioDTO;
      anamneseVigente: AnamneseDTO | null;
      versoes: AnamneseDTO[];
      evolucoes: EvolucaoDTO[];
      procedimentos: ProcedimentoOpcaoDTO[];
    };
