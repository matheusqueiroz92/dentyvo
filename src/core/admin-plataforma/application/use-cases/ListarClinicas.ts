import type {
  ClinicaRepositoryPort,
  FiltrosListagemClinicas,
} from "@/core/auth/application/ports/ClinicaRepositoryPort";
import type { Clinica } from "@/core/auth/domain/Clinica";
import type { AuditoriaLogPort } from "@/core/prontuario/application/ports/AuditoriaLogPort";

import type { UsuarioPlataformaRepositoryPort } from "../ports/UsuarioPlataformaRepositoryPort";
import { CasoDeUsoNaoImplementadoError } from "./nao-implementado";

export type ListarClinicasInput = {
  solicitadoPorUsuarioPlataformaId: string;
  filtros?: FiltrosListagemClinicas;
};

/**
 * Lista clínicas cross-tenant (spec 009).
 * Registra auditoria de leitura (recurso `clinica`).
 */
export class ListarClinicas {
  constructor(
    private readonly clinicaRepo: ClinicaRepositoryPort,
    private readonly usuarioPlataformaRepo: UsuarioPlataformaRepositoryPort,
    private readonly auditoria: AuditoriaLogPort,
  ) {}

  async executar(input: ListarClinicasInput): Promise<Clinica[]> {
    void this.clinicaRepo;
    void this.usuarioPlataformaRepo;
    void this.auditoria;
    void input;
    throw new CasoDeUsoNaoImplementadoError("ListarClinicas");
  }
}
