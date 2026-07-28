import { randomUUID } from "node:crypto";

import type { AuthPort } from "@/core/auth/application/ports/AuthPort";
import type { ClinicaRepositoryPort } from "@/core/auth/application/ports/ClinicaRepositoryPort";
import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";
import { Clinica } from "@/core/auth/domain/Clinica";
import { DocumentoFiscal } from "@/core/auth/domain/DocumentoFiscal";
import type { TipoDocumentoFiscal } from "@/core/auth/domain/DocumentoFiscal";
import {
  DocumentoClinicaDuplicadoError,
  UsuarioJaVinculadoAClinicaError,
} from "@/core/auth/domain/errors";
import { Profissional } from "@/core/auth/domain/Profissional";
import type { AuditoriaLogPort } from "@/core/prontuario/application/ports/AuditoriaLogPort";

import type { UsuarioPlataformaRepositoryPort } from "../ports/UsuarioPlataformaRepositoryPort";
import {
  autorizar,
  obterSolicitantePlataforma,
  registrarAuditoriaPlataforma,
} from "./helpers";

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
    const solicitante = await obterSolicitantePlataforma(
      this.usuarioPlataformaRepo,
      input.solicitadoPorUsuarioPlataformaId,
    );
    autorizar(solicitante, "criar_clinica");

    const documento = DocumentoFiscal.criar(
      input.clinica.tipoDocumento,
      input.clinica.documento,
    );

    const clinicaExistente =
      await this.clinicaRepo.buscarPorDocumento(documento);
    if (clinicaExistente) {
      throw new DocumentoClinicaDuplicadoError(documento.valor);
    }

    const email = input.admin.email.trim().toLowerCase();
    const usuarioExistente = await this.auth.buscarUsuarioPorEmail(email);
    if (usuarioExistente) {
      throw new UsuarioJaVinculadoAClinicaError(email);
    }

    const clinica = Clinica.criar({
      id: randomUUID(),
      nome: input.clinica.nome,
      endereco: input.clinica.endereco,
      documento,
    });

    const usuario = await this.auth.criarUsuario({
      nome: input.admin.nome,
      email,
      senha: input.admin.senha,
    });

    const profissional = Profissional.criar({
      id: randomUUID(),
      clinicaId: clinica.id,
      usuarioId: usuario.id,
      nome: input.admin.nome,
      papel: "admin",
    });

    await this.clinicaRepo.salvar(clinica);
    await this.profissionalRepo.salvar(profissional);

    await registrarAuditoriaPlataforma({
      auditoria: this.auditoria,
      solicitante,
      clinicaId: clinica.id,
      acao: "escrita",
      recursoTipo: "clinica",
      recursoId: clinica.id,
    });

    return clinica;
  }
}
