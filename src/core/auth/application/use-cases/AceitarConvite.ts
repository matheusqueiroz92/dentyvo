import { randomUUID } from "node:crypto";

import {
  ConviteNaoEncontradoError,
  UsuarioJaVinculadoAClinicaError,
} from "../../domain/errors";
import { Profissional } from "../../domain/Profissional";
import type { AuthPort } from "../ports/AuthPort";
import type { ConviteRepositoryPort } from "../ports/ConviteRepositoryPort";
import type { ProfissionalRepositoryPort } from "../ports/ProfissionalRepositoryPort";

export type AceitarConviteInput = {
  token: string;
  nome: string;
  senha: string;
  cro?: string | null;
  especialidade?: string | null;
};

/**
 * Aceita convite válido: cria usuário (se necessário) + Profissional na clínica.
 */
export class AceitarConvite {
  constructor(
    private readonly conviteRepo: ConviteRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
    private readonly auth: AuthPort,
  ) {}

  async executar(input: AceitarConviteInput): Promise<Profissional> {
    const convite = await this.conviteRepo.buscarPorToken(input.token);
    if (!convite) {
      throw new ConviteNaoEncontradoError();
    }

    const aceito = convite.aceitar();

    let usuario = await this.auth.buscarUsuarioPorEmail(aceito.email);
    if (!usuario) {
      usuario = await this.auth.criarUsuario({
        nome: input.nome,
        email: aceito.email,
        senha: input.senha,
      });
    } else {
      const vinculo = await this.profissionalRepo.buscarPorUsuarioId(
        usuario.id,
      );
      if (vinculo) {
        throw new UsuarioJaVinculadoAClinicaError(aceito.email);
      }
    }

    const profissional = Profissional.criar({
      id: randomUUID(),
      clinicaId: aceito.clinicaId,
      usuarioId: usuario.id,
      nome: input.nome,
      papel: aceito.papel,
      cro: input.cro,
      especialidade: input.especialidade,
    });

    await this.profissionalRepo.salvar(profissional);
    await this.conviteRepo.salvar(aceito);

    return profissional;
  }
}
