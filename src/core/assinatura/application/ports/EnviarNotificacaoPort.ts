import type { EnviarNotificacaoInput } from "@/core/notificacao/application/use-cases/EnviarNotificacao";
import type { Notificacao } from "@/core/notificacao/domain";

/**
 * Port de consumo do módulo 011 (spec 012).
 * Não redefine `Notificacao` / `ConteudoNotificacao` — só o contrato de envio.
 *
 * Hierarquia D7 no caso de uso `EnviarAvisoAumentoPreco`:
 * 1. Checar `avisoAumentoPrecoEnviadoEm` **antes** de chamar esta port
 * 2. Passar `chaveNegocio` estável como 2ª camada sob corrida
 */
export interface EnviarNotificacaoPort {
  executar(input: EnviarNotificacaoInput): Promise<Notificacao>;
}
