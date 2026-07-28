import type {
  EmailConviteInput,
  EmailPort,
} from "../../application/ports/EmailPort";

/**
 * Adapter MVP: registra o convite no console.
 * Substituir por provedor real (Resend, SES, etc.) quando definido.
 */
export class ConsoleEmailPort implements EmailPort {
  async enviarConvite(input: EmailConviteInput): Promise<void> {
    console.info("[EmailPort:convite]", {
      para: input.para,
      papel: input.papel,
      clinicaNome: input.clinicaNome,
      token: input.token,
    });
  }
}
