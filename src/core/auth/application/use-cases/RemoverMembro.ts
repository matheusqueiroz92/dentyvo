import { ProfissionalNaoEncontradoError } from "../../domain/errors";
import type { AuthPort } from "../ports/AuthPort";
import type { ProfissionalRepositoryPort } from "../ports/ProfissionalRepositoryPort";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";

export type RemoverMembroInput = {
  clinicaId: string;
  profissionalId: string;
  solicitadoPorUsuarioId: string;
};

export class RemoverMembro {
  constructor(
    private readonly profissionalRepo: ProfissionalRepositoryPort,
    private readonly auth: AuthPort,
  ) {}

  async executar(input: RemoverMembroInput): Promise<void> {
    void this.auth;
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "remover_membro");

    const alvo = await this.profissionalRepo.buscarPorId(
      input.clinicaId,
      input.profissionalId,
    );
    if (!alvo) {
      throw new ProfissionalNaoEncontradoError(input.profissionalId);
    }

    await this.profissionalRepo.remover(input.clinicaId, input.profissionalId);
  }
}
