export {
  DadosInvalidosError,
  PermissaoNegadaError,
} from "@/core/shared/errors";

export { PapelPlataformaInvalidoError } from "./PapelPlataforma";

export class UsuarioPlataformaNaoEncontradoError extends Error {
  readonly nome = "UsuarioPlataformaNaoEncontradoError" as const;

  constructor(readonly usuarioPlataformaId: string) {
    super("Usuário da plataforma não encontrado.");
    this.name = this.nome;
  }
}

export class ClinicaNaoEncontradaError extends Error {
  readonly nome = "ClinicaNaoEncontradaError" as const;

  constructor(readonly clinicaId: string) {
    super("Clínica não encontrada.");
    this.name = this.nome;
  }
}

export class UsuarioDaClinicaNaoEncontradoError extends Error {
  readonly nome = "UsuarioDaClinicaNaoEncontradoError" as const;

  constructor(readonly usuarioId: string) {
    super("Usuário da clínica não encontrado.");
    this.name = this.nome;
  }
}
