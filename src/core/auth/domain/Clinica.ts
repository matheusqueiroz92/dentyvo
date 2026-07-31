import { DadosInvalidosError } from "@/core/shared/errors";

import type { DocumentoFiscal } from "./DocumentoFiscal";
import { assertTemaClinica, type TemaClinica } from "./TemaClinica";

export type StatusClinica = "ativa" | "inativa";

export type ClinicaProps = {
  id: string;
  nome: string;
  endereco: string;
  documento: DocumentoFiscal;
  status: StatusClinica;
  /** URL pública do logo (ex.: Vercel Blob). Null = sem logo. */
  logoUrl: string | null;
  /** Tema visual pré-definido. Null = padrão da UI (`azul-padrao`). */
  tema: TemaClinica | null;
};

export class Clinica {
  readonly id: string;
  readonly nome: string;
  readonly endereco: string;
  readonly documento: DocumentoFiscal;
  readonly status: StatusClinica;
  readonly logoUrl: string | null;
  readonly tema: TemaClinica | null;

  private constructor(props: ClinicaProps) {
    this.id = props.id;
    this.nome = props.nome;
    this.endereco = props.endereco;
    this.documento = props.documento;
    this.status = props.status;
    this.logoUrl = props.logoUrl;
    this.tema = props.tema;
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
      logoUrl: null,
      tema: null,
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
      ...this.toProps(),
      nome,
      endereco,
    });
  }

  /**
   * Atualiza URL do logo (ou remove com `null`).
   * Upload do arquivo fica na delivery/infra (Vercel Blob) — ver
   * `specs/01-architecture.md`.
   */
  atualizarLogo(logoUrl: string | null): Clinica {
    return Clinica.reconstituir({
      ...this.toProps(),
      logoUrl: normalizarLogoUrl(logoUrl),
    });
  }

  /** Atualiza tema visual (ou restaura padrão da UI com `null`). */
  atualizarTema(tema: TemaClinica | string | null): Clinica {
    const temaNormalizado =
      tema == null ? null : assertTemaClinica(String(tema).trim());
    return Clinica.reconstituir({
      ...this.toProps(),
      tema: temaNormalizado,
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
      ...this.toProps(),
      status: "inativa",
    });
  }

  private toProps(): ClinicaProps {
    return {
      id: this.id,
      nome: this.nome,
      endereco: this.endereco,
      documento: this.documento,
      status: this.status,
      logoUrl: this.logoUrl,
      tema: this.tema,
    };
  }
}

function normalizarLogoUrl(logoUrl: string | null): string | null {
  if (logoUrl == null) return null;
  const trimmed = logoUrl.trim();
  if (!trimmed) {
    throw new DadosInvalidosError(
      "URL do logo inválida: informe uma URL ou null para remover.",
    );
  }
  return trimmed;
}
