/**
 * Política de account linking por risco da conta.
 *
 * Better Auth 1.6.x só expõe `requireLocalEmailVerified` global (sem
 * distinção por estado da conta). Usamos `databaseHooks.account.create`
 * + esta regra para:
 * - onboarding incompleto → linking permissivo;
 * - clínica/plataforma completa + e-mail local não verificado + senha
 *   credential → neutralizar (revoga sessões + invalida senha), evitando
 *   account takeover em que um atacante pré-cadastra o e-mail da vítima.
 */

export type AcaoLinkingSocial = "permitir" | "neutralizar";

export type InputDecisaoLinkingSocial = {
  providerId: string;
  temClinicaOuPlataforma: boolean;
  emailVerificadoLocal: boolean;
  temSenhaCredential: boolean;
};

export function decidirAcaoLinkingSocial(
  input: InputDecisaoLinkingSocial,
): AcaoLinkingSocial {
  if (input.providerId === "credential") {
    return "permitir";
  }

  // Sem clínica/plataforma: sem dado sensível — permite retomar onboarding.
  if (!input.temClinicaOuPlataforma) {
    return "permitir";
  }

  // Conta completa não verificada com senha: cenário clássico de takeover.
  if (!input.emailVerificadoLocal && input.temSenhaCredential) {
    return "neutralizar";
  }

  return "permitir";
}

export type PortsNeutralizacaoLinking = {
  revogarSessoes: (usuarioId: string) => Promise<void>;
  invalidarSenhaCredential: (usuarioId: string) => Promise<void>;
};

/**
 * Aplica a decisão de risco. Em `neutralizar`, remove o acesso do possível
 * atacante (senha + sessões) antes/durante o link OAuth.
 */
export async function processarLinkingSocialPorRisco(
  input: InputDecisaoLinkingSocial & { usuarioId: string },
  ports: PortsNeutralizacaoLinking,
): Promise<AcaoLinkingSocial> {
  const acao = decidirAcaoLinkingSocial(input);
  if (acao === "neutralizar") {
    await ports.revogarSessoes(input.usuarioId);
    await ports.invalidarSenhaCredential(input.usuarioId);
  }
  return acao;
}
