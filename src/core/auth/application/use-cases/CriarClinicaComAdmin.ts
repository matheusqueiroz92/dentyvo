import { randomUUID } from "node:crypto";

import { DadosInvalidosError } from "@/core/shared/errors";
import { Slug } from "@/core/shared/Slug";

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
    /** Obrigatória só ao criar usuário novo; omitida se já existe (ex.: Google). */
    senha?: string;
  };
};

/**
 * Cadastro público: Clinica + usuário BetterAuth + Profissional admin.
 * Reutiliza usuário auth existente sem Profissional (onboarding social).
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

    let usuarioId: string;
    if (usuarioExistente) {
      const jaVinculado = await this.profissionalRepo.buscarPorUsuarioId(
        usuarioExistente.id,
      );
      if (jaVinculado) {
        throw new UsuarioJaVinculadoAClinicaError(email);
      }
      usuarioId = usuarioExistente.id;
    } else {
      const senha = input.admin.senha?.trim() ?? "";
      if (senha.length < 8) {
        throw new DadosInvalidosError(
          "Senha obrigatória (mínimo 8 caracteres) para criar a conta.",
        );
      }
      const usuario = await this.auth.criarUsuario({
        nome: input.admin.nome,
        email,
        senha,
      });
      usuarioId = usuario.id;
    }

    const slug = await slugClinicaUnico(
      this.clinicaRepo,
      input.clinica.nome,
    );

    const clinica = Clinica.criar({
      id: randomUUID(),
      nome: input.clinica.nome,
      endereco: input.clinica.endereco,
      documento,
      slug,
    });

    const profissional = Profissional.criar({
      id: randomUUID(),
      clinicaId: clinica.id,
      usuarioId,
      nome: input.admin.nome,
      papel: "admin",
    });

    await this.clinicaRepo.salvar(clinica);
    await this.profissionalRepo.salvar(profissional);

    return clinica;
  }
}

async function slugClinicaUnico(
  clinicaRepo: ClinicaRepositoryPort,
  nome: string,
): Promise<string> {
  const base = Slug.criarAPartirDoNome(nome).valor;
  let candidato = base;
  let sufixo = 0;
  while (await clinicaRepo.buscarPorSlug(candidato)) {
    sufixo += 1;
    candidato = `${base}-${sufixo}`;
  }
  return candidato;
}
