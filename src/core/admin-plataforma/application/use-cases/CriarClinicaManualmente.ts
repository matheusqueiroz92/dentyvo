import type { AuthPort } from "@/core/auth/application/ports/AuthPort";
import type { ClinicaRepositoryPort } from "@/core/auth/application/ports/ClinicaRepositoryPort";
import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";
import type { Clinica } from "@/core/auth/domain/Clinica";
import type { TipoDocumentoFiscal } from "@/core/auth/domain/DocumentoFiscal";
import type { AuditoriaLogPort } from "@/core/prontuario/application/ports/AuditoriaLogPort";

import type { UsuarioPlataformaRepositoryPort } from "../ports/UsuarioPlataformaRepositoryPort";
import { CasoDeUsoNaoImplementadoError } from "./nao-implementado";

export type CriarClinicaManualmenteInput = {
  solicitadoPorUsuarioPlataformaId: string;
  clinica: {
    nome: string;
    endereco: string;
    tipoDocumento: TipoDocumentoFiscal;
    documento: string;
  };
  admin: {
    nome: string;
    email: string;
    senha: string;
  };
};

/**
 * Onboarding assistido pelo super-admin (spec 009).
 * Distinto do cadastro público `CriarClinicaComAdmin` (001): exige ator
 * plataforma + auditoria.
 */
export class CriarClinicaManualmente {
  constructor(
    private readonly clinicaRepo: ClinicaRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
    private readonly usuarioPlataformaRepo: UsuarioPlataformaRepositoryPort,
    private readonly auth: AuthPort,
    private readonly auditoria: AuditoriaLogPort,
  ) {}

  async executar(input: CriarClinicaManualmenteInput): Promise<Clinica> {
    void this.clinicaRepo;
    void this.profissionalRepo;
    void this.usuarioPlataformaRepo;
    void this.auth;
    void this.auditoria;
    void input;
    throw new CasoDeUsoNaoImplementadoError("CriarClinicaManualmente");
  }
}
