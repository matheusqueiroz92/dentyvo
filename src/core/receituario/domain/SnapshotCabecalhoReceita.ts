import { DadosInvalidosError } from "@/core/shared/errors";

import { SnapshotCabecalhoInvalidoError } from "./errors";

export type SnapshotCabecalhoReceitaProps = {
  clinicaNome: string;
  clinicaEndereco: string;
  profissionalNome: string;
  profissionalCro: string;
  pacienteNome: string;
  pacienteCpf: string;
  /** Opcional — congelado na emissão quando existir. */
  pacienteDataNascimento: Date | null;
  /** Opcional — congelado na emissão quando existir. */
  profissionalEspecialidade: string | null;
};

/**
 * Cabeçalho congelado no momento da emissão (spec 006).
 * PDF e histórico usam este snapshot — nunca resolvem cadastro ao vivo.
 */
export class SnapshotCabecalhoReceita {
  readonly clinicaNome: string;
  readonly clinicaEndereco: string;
  readonly profissionalNome: string;
  readonly profissionalCro: string;
  readonly pacienteNome: string;
  readonly pacienteCpf: string;
  readonly pacienteDataNascimento: Date | null;
  readonly profissionalEspecialidade: string | null;

  private constructor(props: SnapshotCabecalhoReceitaProps) {
    this.clinicaNome = props.clinicaNome;
    this.clinicaEndereco = props.clinicaEndereco;
    this.profissionalNome = props.profissionalNome;
    this.profissionalCro = props.profissionalCro;
    this.pacienteNome = props.pacienteNome;
    this.pacienteCpf = props.pacienteCpf;
    this.pacienteDataNascimento = props.pacienteDataNascimento;
    this.profissionalEspecialidade = props.profissionalEspecialidade;
  }

  static criar(input: {
    clinicaNome: string;
    clinicaEndereco: string;
    profissionalNome: string;
    profissionalCro: string;
    pacienteNome: string;
    pacienteCpf: string;
    pacienteDataNascimento?: Date | null;
    profissionalEspecialidade?: string | null;
  }): SnapshotCabecalhoReceita {
    const dataNascimento =
      input.pacienteDataNascimento === undefined
        ? null
        : input.pacienteDataNascimento;

    if (dataNascimento !== null) {
      assertDataValida(dataNascimento, "pacienteDataNascimento");
    }

    return new SnapshotCabecalhoReceita({
      clinicaNome: assertCampo(input.clinicaNome, "clinicaNome"),
      clinicaEndereco: assertCampo(input.clinicaEndereco, "clinicaEndereco"),
      profissionalNome: assertCampo(
        input.profissionalNome,
        "profissionalNome",
      ),
      profissionalCro: assertCampo(input.profissionalCro, "profissionalCro"),
      pacienteNome: assertCampo(input.pacienteNome, "pacienteNome"),
      pacienteCpf: assertCampo(input.pacienteCpf, "pacienteCpf"),
      pacienteDataNascimento: dataNascimento,
      profissionalEspecialidade: normalizarOpcional(
        input.profissionalEspecialidade,
      ),
    });
  }

  static reconstituir(
    props: SnapshotCabecalhoReceitaProps,
  ): SnapshotCabecalhoReceita {
    return new SnapshotCabecalhoReceita(props);
  }

  paraProps(): SnapshotCabecalhoReceitaProps {
    return {
      clinicaNome: this.clinicaNome,
      clinicaEndereco: this.clinicaEndereco,
      profissionalNome: this.profissionalNome,
      profissionalCro: this.profissionalCro,
      pacienteNome: this.pacienteNome,
      pacienteCpf: this.pacienteCpf,
      pacienteDataNascimento: this.pacienteDataNascimento,
      profissionalEspecialidade: this.profissionalEspecialidade,
    };
  }
}

function assertCampo(valor: string, campo: string): string {
  const trimmed = valor.trim();
  if (!trimmed) {
    throw new SnapshotCabecalhoInvalidoError(campo);
  }
  return trimmed;
}

function normalizarOpcional(valor: string | null | undefined): string | null {
  if (valor == null) return null;
  const trimmed = valor.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function assertDataValida(data: Date, campo: string): void {
  if (!(data instanceof Date) || Number.isNaN(data.getTime())) {
    throw new DadosInvalidosError(`${campo} inválida.`);
  }
}
