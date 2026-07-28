import { DadosInvalidosError } from "@/core/shared/errors";

import { SecaoAnamneseInvalidaError } from "./errors";

export const SECOES_ANAMNESE = [
  "historicoMedico",
  "alergias",
  "medicacoesEmUso",
  "condicoesPreexistentes",
] as const;

export type NomeSecaoAnamnese = (typeof SECOES_ANAMNESE)[number];

/**
 * Conteúdo de uma seção MVP: texto livre e/ou flag de negação
 * (“nega” / “nada a declarar”). Checklist clínico específico fica para Onda 3.
 */
export type SecaoAnamnese = {
  texto: string | null;
  negado: boolean;
};

export type RespostasAnamneseProps = {
  historicoMedico: SecaoAnamnese;
  alergias: SecaoAnamnese;
  medicacoesEmUso: SecaoAnamnese;
  condicoesPreexistentes: SecaoAnamnese;
};

/**
 * Value object das 4 seções obrigatórias da anamnese (spec 003).
 * Cada seção exige texto não vazio **ou** `negado: true`.
 */
export class RespostasAnamnese {
  readonly historicoMedico: SecaoAnamnese;
  readonly alergias: SecaoAnamnese;
  readonly medicacoesEmUso: SecaoAnamnese;
  readonly condicoesPreexistentes: SecaoAnamnese;

  private constructor(props: RespostasAnamneseProps) {
    this.historicoMedico = props.historicoMedico;
    this.alergias = props.alergias;
    this.medicacoesEmUso = props.medicacoesEmUso;
    this.condicoesPreexistentes = props.condicoesPreexistentes;
  }

  static criar(input: RespostasAnamneseProps): RespostasAnamnese {
    return new RespostasAnamnese({
      historicoMedico: normalizarSecao(input.historicoMedico, "historicoMedico"),
      alergias: normalizarSecao(input.alergias, "alergias"),
      medicacoesEmUso: normalizarSecao(input.medicacoesEmUso, "medicacoesEmUso"),
      condicoesPreexistentes: normalizarSecao(
        input.condicoesPreexistentes,
        "condicoesPreexistentes",
      ),
    });
  }

  static reconstituir(props: RespostasAnamneseProps): RespostasAnamnese {
    return new RespostasAnamnese(props);
  }

  toProps(): RespostasAnamneseProps {
    return {
      historicoMedico: this.historicoMedico,
      alergias: this.alergias,
      medicacoesEmUso: this.medicacoesEmUso,
      condicoesPreexistentes: this.condicoesPreexistentes,
    };
  }
}

function normalizarSecao(
  secao: SecaoAnamnese,
  nome: NomeSecaoAnamnese,
): SecaoAnamnese {
  if (secao == null || typeof secao !== "object") {
    throw new DadosInvalidosError(`Seção "${nome}" é obrigatória.`);
  }

  const texto =
    secao.texto == null ? null : secao.texto.trim() || null;
  const negado = Boolean(secao.negado);

  if (!negado && texto == null) {
    throw new SecaoAnamneseInvalidaError(nome);
  }

  return { texto, negado };
}
