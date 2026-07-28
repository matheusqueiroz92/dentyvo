import { ProfissionalNaoEncontradoError } from "../../domain/errors";
import type { AuthPort } from "../ports/AuthPort";
import type { ProfissionalRepositoryPort } from "../ports/ProfissionalRepositoryPort";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";

export type RevogarSessoesDoMembroInput = {
  clinicaId: string;
  profissionalId: string;
  solicitadoPorUsuarioId: string;
};

export class RevogarSessoesDoMembro {
  constructor(
    private readonly profissionalRepo: ProfissionalRepositoryPort,
    private readonly auth: AuthPort,
  ) {}

  async executar(input: RevogarSessoesDoMembroInput): Promise<void> {
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "revogar_sessoes_membro");

    const alvo = await this.profissionalRepo.buscarPorId(
      input.clinicaId,
      input.profissionalId,
    );
    if (!alvo) {
      throw new ProfissionalNaoEncontradoError(input.profissionalId);
    }

    await this.auth.revogarSessoesDoUsuario(alvo.usuarioId);
  }
}
