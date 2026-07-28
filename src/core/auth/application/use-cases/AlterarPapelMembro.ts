import {
  ProfissionalNaoEncontradoError,
} from "../../domain/errors";
import type { Papel } from "../../domain/Papel";
import type { Profissional } from "../../domain/Profissional";
import type { AuthPort } from "../ports/AuthPort";
import type { ProfissionalRepositoryPort } from "../ports/ProfissionalRepositoryPort";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";

export type AlterarPapelMembroInput = {
  clinicaId: string;
  profissionalId: string;
  novoPapel: Papel;
  solicitadoPorUsuarioId: string;
  /** Obrigatório ao promover para dentista se o membro ainda não tiver CRO. */
  cro?: string | null;
};

export class AlterarPapelMembro {
  constructor(
    private readonly profissionalRepo: ProfissionalRepositoryPort,
    private readonly auth: AuthPort,
  ) {}

  async executar(input: AlterarPapelMembroInput): Promise<Profissional> {
    void this.auth;
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "alterar_papel_membro");

    const alvo = await this.profissionalRepo.buscarPorId(
      input.clinicaId,
      input.profissionalId,
    );
    if (!alvo) {
      throw new ProfissionalNaoEncontradoError(input.profissionalId);
    }

    const atualizado = alvo.alterarPapel(input.novoPapel, input.cro);
    await this.profissionalRepo.salvar(atualizado);
    return atualizado;
  }
}
