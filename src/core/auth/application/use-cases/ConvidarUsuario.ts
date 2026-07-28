import { randomBytes, randomUUID } from "node:crypto";

import { Convite } from "../../domain/Convite";
import { UsuarioJaVinculadoAClinicaError } from "../../domain/errors";
import type { Papel } from "../../domain/Papel";
import type { AuthPort } from "../ports/AuthPort";
import type { ClinicaRepositoryPort } from "../ports/ClinicaRepositoryPort";
import type { ConviteRepositoryPort } from "../ports/ConviteRepositoryPort";
import type { EmailPort } from "../ports/EmailPort";
import type { ProfissionalRepositoryPort } from "../ports/ProfissionalRepositoryPort";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";

export type ConvidarUsuarioInput = {
  clinicaId: string;
  email: string;
  papel: Papel;
  convidadoPorUsuarioId: string;
};

/**
 * Admin convida membro (admin | dentista | recepcao). TTL do token: 72h.
 */
export class ConvidarUsuario {
  constructor(
    private readonly conviteRepo: ConviteRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
    private readonly clinicaRepo: ClinicaRepositoryPort,
    private readonly auth: AuthPort,
    private readonly email: EmailPort,
  ) {}

  async executar(input: ConvidarUsuarioInput): Promise<Convite> {
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.convidadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "convidar_usuario");

    const email = input.email.trim().toLowerCase();
    const usuarioExistente = await this.auth.buscarUsuarioPorEmail(email);
    if (usuarioExistente) {
      const vinculo = await this.profissionalRepo.buscarPorUsuarioId(
        usuarioExistente.id,
      );
      if (vinculo) {
        throw new UsuarioJaVinculadoAClinicaError(email);
      }
    }

    const clinica = await this.clinicaRepo.buscarPorId(input.clinicaId);
    const clinicaNome = clinica?.nome ?? "sua clínica";

    const convite = Convite.criar({
      id: randomUUID(),
      clinicaId: input.clinicaId,
      email,
      papel: input.papel,
      token: randomBytes(32).toString("hex"),
      convidadoPorUsuarioId: input.convidadoPorUsuarioId,
    });

    await this.conviteRepo.salvar(convite);
    await this.email.enviarConvite({
      para: email,
      token: convite.token,
      clinicaNome,
      papel: convite.papel,
    });

    return convite;
  }
}
