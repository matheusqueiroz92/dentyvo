import { DadosInvalidosError } from "./errors";

export type SnapshotCabecalhoDocumentoProps = {
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
 * Cabeçalho congelado no momento da emissão de documento clínico
 * (Receita 006 e Atestado 006b).
 * PDF e histórico usam este snapshot — nunca resolvem cadastro ao vivo.
 *
 * Generalização puramente estrutural de `SnapshotCabecalhoReceita`:
 * mesmos campos, mesma validação, mesma forma JSON persistida.
 */
export class SnapshotCabecalhoDocumento {
  readonly clinicaNome: string;
  readonly clinicaEndereco: string;
  readonly profissionalNome: string;
  readonly profissionalCro: string;
  readonly pacienteNome: string;
  readonly pacienteCpf: string;
  readonly pacienteDataNascimento: Date | null;
  readonly profissionalEspecialidade: string | null;

  private constructor(props: SnapshotCabecalhoDocumentoProps) {
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
  }): SnapshotCabecalhoDocumento {
    const dataNascimento =
      input.pacienteDataNascimento === undefined
        ? null
        : input.pacienteDataNascimento;

    if (dataNascimento !== null) {
      assertDataValida(dataNascimento, "pacienteDataNascimento");
    }

    return new SnapshotCabecalhoDocumento({
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
    props: SnapshotCabecalhoDocumentoProps,
  ): SnapshotCabecalhoDocumento {
    return new SnapshotCabecalhoDocumento(props);
  }

  paraProps(): SnapshotCabecalhoDocumentoProps {
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

export class SnapshotCabecalhoInvalidoError extends Error {
  readonly nome = "SnapshotCabecalhoInvalidoError" as const;

  constructor(readonly campo: string) {
    super(`Snapshot de cabeçalho inválido: campo "${campo}" é obrigatório.`);
    this.name = this.nome;
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
