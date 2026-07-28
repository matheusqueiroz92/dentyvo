import type { AuthPort } from "@/core/auth/application/ports/AuthPort";
import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";
import type { AuditoriaLogPort } from "@/core/prontuario/application/ports/AuditoriaLogPort";

import { UsuarioDaClinicaNaoEncontradoError } from "../../domain/errors";
import type { UsuarioPlataformaRepositoryPort } from "../ports/UsuarioPlataformaRepositoryPort";
import {
  autorizar,
  obterSolicitantePlataforma,
  registrarAuditoriaPlataforma,
} from "./helpers";

export type RevogarSessoesDoUsuarioInput = {
  solicitadoPorUsuarioPlataformaId: string;
  /** `usuarioId` BetterAuth — alvo das sessões a revogar. */
  usuarioId: string;
};

/**
 * Revoga todas as sessões ativas do usuário BetterAuth (spec 009).
 * Mesma semântica de `RevogarSessoesDoMembro` (001), cross-tenant.
 * Reutiliza `AuthPort.revogarSessoesDoUsuario` — não recria integração BetterAuth.
 *
 * Não altera senha: o usuário pode logar de novo com as mesmas credenciais.
 * Reset de senha é `ResetarSenhaUsuario` (próxima iteração).
 */
export class RevogarSessoesDoUsuario {
  constructor(
    private readonly profissionalRepo: ProfissionalRepositoryPort,
    private readonly usuarioPlataformaRepo: UsuarioPlataformaRepositoryPort,
    private readonly auth: AuthPort,
    private readonly auditoria: AuditoriaLogPort,
  ) {}

  async executar(input: RevogarSessoesDoUsuarioInput): Promise<void> {
    const solicitante = await obterSolicitantePlataforma(
      this.usuarioPlataformaRepo,
      input.solicitadoPorUsuarioPlataformaId,
    );
    autorizar(solicitante, "revogar_sessoes_usuario");

    const alvo = await this.profissionalRepo.buscarPorUsuarioId(input.usuarioId);
    if (!alvo) {
      throw new UsuarioDaClinicaNaoEncontradoError(input.usuarioId);
    }

    await this.auth.revogarSessoesDoUsuario(alvo.usuarioId);

    await registrarAuditoriaPlataforma({
      auditoria: this.auditoria,
      solicitante,
      clinicaId: alvo.clinicaId,
      acao: "escrita",
      recursoTipo: "profissional",
      recursoId: alvo.id,
    });
  }
}
