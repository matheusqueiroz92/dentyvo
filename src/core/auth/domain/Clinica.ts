import type { DocumentoFiscal } from "./DocumentoFiscal";
import { DadosInvalidosError } from "@/core/shared/errors";

export type StatusClinica = "ativa" | "inativa";

export type ClinicaProps = {
  id: string;
  nome: string;
  endereco: string;
  documento: DocumentoFiscal;
  status: StatusClinica;
};

export class Clinica {
  readonly id: string;
  readonly nome: string;
  readonly endereco: string;
  readonly documento: DocumentoFiscal;
  readonly status: StatusClinica;

  private constructor(props: ClinicaProps) {
    this.id = props.id;
    this.nome = props.nome;
    this.endereco = props.endereco;
    this.documento = props.documento;
    this.status = props.status;
  }

  /** Factory do cadastro público — status inicial sempre `ativa` (spec 001). */
  static criar(input: {
    id: string;
    nome: string;
    endereco: string;
    documento: DocumentoFiscal;
  }): Clinica {
    const nome = input.nome.trim();
    const endereco = input.endereco.trim();
    if (!nome) {
      throw new DadosInvalidosError("Nome da clínica é obrigatório.");
    }
    if (!endereco) {
      throw new DadosInvalidosError("Endereço da clínica é obrigatório.");
    }

    return new Clinica({
      id: input.id,
      nome,
      endereco,
      documento: input.documento,
      status: "ativa",
    });
  }

  static reconstituir(props: ClinicaProps): Clinica {
    return new Clinica(props);
  }

  atualizarDadosCadastrais(input: {
    nome: string;
    endereco: string;
  }): Clinica {
    const nome = input.nome.trim();
    const endereco = input.endereco.trim();
    if (!nome) {
      throw new DadosInvalidosError("Nome da clínica é obrigatório.");
    }
    if (!endereco) {
      throw new DadosInvalidosError("Endereço da clínica é obrigatório.");
    }

    return Clinica.reconstituir({
      id: this.id,
      nome,
      endereco,
      documento: this.documento,
      status: this.status,
    });
  }

  /**
   * Soft-delete (spec 009): marca `inativa` sem apagar prontuário/dado clínico.
   * Idempotente se já estiver inativa.
   */
  desativar(): Clinica {
    if (this.status === "inativa") {
      return this;
    }

    return Clinica.reconstituir({
      id: this.id,
      nome: this.nome,
      endereco: this.endereco,
      documento: this.documento,
      status: "inativa",
    });
  }
}
