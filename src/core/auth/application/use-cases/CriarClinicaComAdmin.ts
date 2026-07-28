import { randomUUID } from "node:crypto";

import { Clinica } from "../../domain/Clinica";
import { DocumentoFiscal } from "../../domain/DocumentoFiscal";
import type { TipoDocumentoFiscal } from "../../domain/DocumentoFiscal";
import {
  DocumentoClinicaDuplicadoError,
  UsuarioJaVinculadoAClinicaError,
} from "../../domain/errors";
import { Profissional } from "../../domain/Profissional";
import type { AuthPort } from "../ports/AuthPort";
import type { ClinicaRepositoryPort } from "../ports/ClinicaRepositoryPort";
import type { ProfissionalRepositoryPort } from "../ports/ProfissionalRepositoryPort";

export type CriarClinicaComAdminInput = {
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
 * Cadastro público: Clinica + usuário BetterAuth + Profissional admin.
 */
export class CriarClinicaComAdmin {
  constructor(
    private readonly clinicaRepo: ClinicaRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
    private readonly auth: AuthPort,
  ) {}

  async executar(input: CriarClinicaComAdminInput): Promise<Clinica> {
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

    return clinica;
  }
}
