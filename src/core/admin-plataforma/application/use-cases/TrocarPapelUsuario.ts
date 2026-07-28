import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";
import { ProfissionalNaoEncontradoError } from "@/core/auth/domain/errors";
import type { Papel } from "@/core/auth/domain/Papel";
import type { Profissional } from "@/core/auth/domain/Profissional";
import type { AuditoriaLogPort } from "@/core/prontuario/application/ports/AuditoriaLogPort";

import type { UsuarioPlataformaRepositoryPort } from "../ports/UsuarioPlataformaRepositoryPort";
import {
  autorizar,
  obterSolicitantePlataforma,
  registrarAuditoriaPlataforma,
} from "./helpers";

export type TrocarPapelUsuarioInput = {
  solicitadoPorUsuarioPlataformaId: string;
  clinicaId: string;
  profissionalId: string;
  novoPapel: Papel;
  /** Obrigatório ao promover para dentista se o membro ainda não tiver CRO. */
  cro?: string | null;
};

/**
 * Altera o papel de um `Profissional` em qualquer clínica (spec 009).
 * Reaproveita invariantes de domínio de `Profissional.alterarPapel` (001):
 * CRO obrigatório para `dentista`. Não revoga sessões automaticamente.
 */
export class TrocarPapelUsuario {
  constructor(
    private readonly profissionalRepo: ProfissionalRepositoryPort,
    private readonly usuarioPlataformaRepo: UsuarioPlataformaRepositoryPort,
    private readonly auditoria: AuditoriaLogPort,
  ) {}

  async executar(input: TrocarPapelUsuarioInput): Promise<Profissional> {
    const solicitante = await obterSolicitantePlataforma(
      this.usuarioPlataformaRepo,
      input.solicitadoPorUsuarioPlataformaId,
    );
    autorizar(solicitante, "trocar_papel_usuario");

    const alvo = await this.profissionalRepo.buscarPorId(
      input.clinicaId,
      input.profissionalId,
    );
    if (!alvo) {
      throw new ProfissionalNaoEncontradoError(input.profissionalId);
    }

    const atualizado = alvo.alterarPapel(input.novoPapel, input.cro);
    await this.profissionalRepo.salvar(atualizado);

    await registrarAuditoriaPlataforma({
      auditoria: this.auditoria,
      solicitante,
      clinicaId: input.clinicaId,
      acao: "escrita",
      recursoTipo: "profissional",
      recursoId: atualizado.id,
    });

    return atualizado;
  }
}
