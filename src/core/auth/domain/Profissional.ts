import {
  DadosInvalidosError,
  TenantMismatchError,
} from "@/core/shared/errors";

import { CroObrigatorioError } from "./errors";
import type { Papel } from "./Papel";

export type ProfissionalProps = {
  id: string;
  clinicaId: string;
  usuarioId: string;
  nome: string;
  papel: Papel;
  cro: string | null;
  especialidade: string | null;
};

export class Profissional {
  readonly id: string;
  readonly clinicaId: string;
  readonly usuarioId: string;
  readonly nome: string;
  readonly papel: Papel;
  readonly cro: string | null;
  readonly especialidade: string | null;

  private constructor(props: ProfissionalProps) {
    this.id = props.id;
    this.clinicaId = props.clinicaId;
    this.usuarioId = props.usuarioId;
    this.nome = props.nome;
    this.papel = props.papel;
    this.cro = props.cro;
    this.especialidade = props.especialidade;
  }

  static criar(input: {
    id: string;
    clinicaId: string;
    usuarioId: string;
    nome: string;
    papel: Papel;
    cro?: string | null;
    especialidade?: string | null;
  }): Profissional {
    const nome = input.nome.trim();
    if (!nome) {
      throw new DadosInvalidosError("Nome do profissional é obrigatório.");
    }

    const cro = normalizarOpcional(input.cro);
    const especialidade = normalizarOpcional(input.especialidade);
    assertCroSeDentista(input.papel, cro);

    return new Profissional({
      id: input.id,
      clinicaId: input.clinicaId,
      usuarioId: input.usuarioId,
      nome,
      papel: input.papel,
      cro,
      especialidade,
    });
  }

  static reconstituir(props: ProfissionalProps): Profissional {
    return new Profissional(props);
  }

  alterarPapel(novoPapel: Papel, cro?: string | null): Profissional {
    const croFinal =
      novoPapel === "dentista"
        ? (normalizarOpcional(cro) ?? this.cro)
        : normalizarOpcional(cro);
    assertCroSeDentista(novoPapel, croFinal);

    return Profissional.reconstituir({
      id: this.id,
      clinicaId: this.clinicaId,
      usuarioId: this.usuarioId,
      nome: this.nome,
      papel: novoPapel,
      cro: croFinal,
      especialidade: this.especialidade,
    });
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

function assertCroSeDentista(papel: Papel, cro: string | null): void {
  if (papel === "dentista" && !cro) {
    throw new CroObrigatorioError();
  }
}
