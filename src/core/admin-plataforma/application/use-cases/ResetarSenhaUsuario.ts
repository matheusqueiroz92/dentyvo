import type { AuthPort } from "@/core/auth/application/ports/AuthPort";
import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";
import type { AuditoriaLogPort } from "@/core/prontuario/application/ports/AuditoriaLogPort";

import type { UsuarioPlataformaRepositoryPort } from "../ports/UsuarioPlataformaRepositoryPort";
import { CasoDeUsoNaoImplementadoError } from "./nao-implementado";

export type ResetarSenhaUsuarioInput = {
  solicitadoPorUsuarioPlataformaId: string;
  usuarioId: string;
};

/**
 * Próxima iteração (spec 009) — NÃO implementar no MVP.
 *
 * Super-admin aciona geração de senha temporária ou fluxo de redefinição
 * em nome do usuário (invalida a credencial anterior). Cobre cenários que
 * `RevogarSessoesDoUsuario` não resolve: esquecimento de senha, conta
 * comprometida, saída da clínica com senha ainda válida.
 *
 * Assinatura reservada para alinhar o módulo; corpo permanece stub.
 * Pode exigir extensão futura de `AuthPort` (hoje só revoga sessões).
 */
export class ResetarSenhaUsuario {
  constructor(
    private readonly profissionalRepo: ProfissionalRepositoryPort,
    private readonly usuarioPlataformaRepo: UsuarioPlataformaRepositoryPort,
    private readonly auth: AuthPort,
    private readonly auditoria: AuditoriaLogPort,
  ) {}

  async executar(input: ResetarSenhaUsuarioInput): Promise<void> {
    void this.profissionalRepo;
    void this.usuarioPlataformaRepo;
    void this.auth;
    void this.auditoria;
    void input;
    throw new CasoDeUsoNaoImplementadoError("ResetarSenhaUsuario");
  }
}
