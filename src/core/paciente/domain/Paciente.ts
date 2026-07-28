import {
  DadosInvalidosError,
  TenantMismatchError,
} from "@/core/shared/errors";

import { Cpf } from "./Cpf";

export type PacienteProps = {
  id: string;
  clinicaId: string;
  nome: string;
  cpf: Cpf;
  telefone: string;
  dataNascimento: Date;
  contatoEmergencia: string | null;
};

export class Paciente {
  readonly id: string;
  readonly clinicaId: string;
  readonly nome: string;
  readonly cpf: Cpf;
  readonly telefone: string;
  readonly dataNascimento: Date;
  readonly contatoEmergencia: string | null;

  private constructor(props: PacienteProps) {
    this.id = props.id;
    this.clinicaId = props.clinicaId;
    this.nome = props.nome;
    this.cpf = props.cpf;
    this.telefone = props.telefone;
    this.dataNascimento = props.dataNascimento;
    this.contatoEmergencia = props.contatoEmergencia;
  }

  static criar(input: {
    id: string;
    clinicaId: string;
    nome: string;
    cpf: string;
    telefone: string;
    dataNascimento: Date;
    contatoEmergencia?: string | null;
  }): Paciente {
    const nome = input.nome.trim();
    if (!nome) {
      throw new DadosInvalidosError("Nome do paciente é obrigatório.");
    }

    const telefone = normalizarTelefone(input.telefone);
    if (!telefone) {
      throw new DadosInvalidosError("Telefone do paciente é obrigatório.");
    }

    if (!(input.dataNascimento instanceof Date) || Number.isNaN(input.dataNascimento.getTime())) {
      throw new DadosInvalidosError("Data de nascimento inválida.");
    }

    return new Paciente({
      id: input.id,
      clinicaId: input.clinicaId,
      nome,
      cpf: Cpf.criar(input.cpf),
      telefone,
      dataNascimento: input.dataNascimento,
      contatoEmergencia: normalizarOpcional(input.contatoEmergencia),
    });
  }

  static reconstituir(props: PacienteProps): Paciente {
    return new Paciente(props);
  }

  assertPertenceAClinica(clinicaId: string): void {
    if (this.clinicaId !== clinicaId) {
      throw new TenantMismatchError(clinicaId, this.clinicaId);
    }
  }
}

function normalizarOpcional(valor: string | null | undefined): string | null {
  if (valor == null) return null;
  const trimmed = valor.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Mantém apenas dígitos (WhatsApp/telefone BR). */
function normalizarTelefone(bruto: string): string {
  return bruto.replace(/\D/g, "");
}
