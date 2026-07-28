import type { AuthPort } from "@/core/auth/application/ports/AuthPort";
import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";
import type { AuditoriaLogPort } from "@/core/prontuario/application/ports/AuditoriaLogPort";

import type { UsuarioPlataformaRepositoryPort } from "../ports/UsuarioPlataformaRepositoryPort";
import { CasoDeUsoNaoImplementadoError } from "./nao-implementado";

export type RemoverUsuarioInput = {
  solicitadoPorUsuarioPlataformaId: string;
  /** `usuarioId` BetterAuth (spec 009) — resolve o `Profissional` vinculado. */
  usuarioId: string;
};

/**
 * Remove o vínculo profissional/usuário de uma clínica (spec 009).
 * Cross-tenant: não exige `clinicaId` no input — obtido do profissional.
 */
export class RemoverUsuario {
  constructor(
    private readonly profissionalRepo: ProfissionalRepositoryPort,
    private readonly usuarioPlataformaRepo: UsuarioPlataformaRepositoryPort,
    private readonly auth: AuthPort,
    private readonly auditoria: AuditoriaLogPort,
  ) {}

  async executar(input: RemoverUsuarioInput): Promise<void> {
    void this.profissionalRepo;
    void this.usuarioPlataformaRepo;
    void this.auth;
    void this.auditoria;
    void input;
    throw new CasoDeUsoNaoImplementadoError("RemoverUsuario");
  }
}
