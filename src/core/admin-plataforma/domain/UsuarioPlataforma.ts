import { DadosInvalidosError } from "@/core/shared/errors";

import {
  assertPapelPlataforma,
  type PapelPlataforma,
} from "./PapelPlataforma";

export type UsuarioPlataformaProps = {
  id: string;
  nome: string;
  email: string;
  papel: PapelPlataforma;
};

/**
 * Usuário cross-tenant da Dentyvo (spec 009 / modelo de domínio).
 * Invariante: nunca possui `clinicaId` — é a única identidade com acesso
 * legitimamente fora do RBAC de clínica.
 */
export class UsuarioPlataforma {
  readonly id: string;
  readonly nome: string;
  readonly email: string;
  readonly papel: PapelPlataforma;

  private constructor(props: UsuarioPlataformaProps) {
    this.id = props.id;
    this.nome = props.nome;
    this.email = props.email;
    this.papel = props.papel;
  }

  /**
   * Factory de provisionamento (seed/manual) — nunca via cadastro público.
   * Rejeita explicitamente qualquer tentativa de vincular `clinicaId`.
   */
  static criar(input: {
    id: string;
    nome: string;
    email: string;
    papel?: PapelPlataforma | string;
    /** Proibido — aceito só para rejeitar no domínio (plano de testes 009). */
    clinicaId?: string | null;
  }): UsuarioPlataforma {
    if (input.clinicaId != null && String(input.clinicaId).trim() !== "") {
      throw new DadosInvalidosError(
        "UsuarioPlataforma não pode ter clinicaId.",
      );
    }

    const nome = input.nome.trim();
    if (!nome) {
      throw new DadosInvalidosError("Nome do usuário da plataforma é obrigatório.");
    }

    const email = input.email.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      throw new DadosInvalidosError("E-mail do usuário da plataforma é inválido.");
    }

    const papel = assertPapelPlataforma(input.papel ?? "super-admin");

    return new UsuarioPlataforma({
      id: assertCampo(input.id, "id"),
      nome,
      email,
      papel,
    });
  }

  static reconstituir(props: UsuarioPlataformaProps): UsuarioPlataforma {
    return new UsuarioPlataforma(props);
  }
}

function assertCampo(valor: string, campo: string): string {
  const trimmed = valor.trim();
  if (!trimmed) {
    throw new DadosInvalidosError(`${campo} do usuário da plataforma é obrigatório.`);
  }
  return trimmed;
}
