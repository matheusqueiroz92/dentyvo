import type { ClinicWhatsappAccountRepositoryPort } from "../ports/ClinicWhatsappAccountRepositoryPort";

export type RotearEventoWhatsappInput = {
  /** `phone_number_id` distintos recebidos num payload do webhook. */
  phoneNumberIds: string[];
};

export type EventoWhatsappRoteado = {
  phoneNumberId: string;
  clinicaId: string;
};

export type RotearEventoWhatsappOutput = {
  /** Números resolvidos para uma clínica apta a operar. */
  reconhecidos: EventoWhatsappRoteado[];
  /** Números sem conta correspondente ou com conta inapta — descartados. */
  descartados: string[];
};

/**
 * Resolve, para cada `phone_number_id` de um payload do webhook compartilhado,
 * qual clínica é a destinatária (spec 008).
 *
 * Ator é a própria Meta, não um `Profissional` — por isso não há RBAC aqui. A
 * resolução é cross-tenant de propósito; o isolamento vem de devolver o
 * `clinicaId` correto por número.
 *
 * Número desconhecido (ou de conta desconectada) é descartado com log, sem
 * lançar: um evento não roteável não pode derrubar o processamento dos demais
 * nem gerar 5xx que faça a Meta reentregar o lote.
 *
 * O consumo das mensagens em si é a spec 007, ainda não implementada.
 */
export class RotearEventoWhatsapp {
  constructor(
    private readonly contaRepo: ClinicWhatsappAccountRepositoryPort,
  ) {}

  async executar(
    input: RotearEventoWhatsappInput,
  ): Promise<RotearEventoWhatsappOutput> {
    const reconhecidos: EventoWhatsappRoteado[] = [];
    const descartados: string[] = [];

    for (const phoneNumberId of input.phoneNumberIds) {
      const conta = await this.contaRepo.buscarPorPhoneNumberId(phoneNumberId);

      if (conta == null || !conta.podeEnviarMensagens()) {
        descartados.push(phoneNumberId);
        console.warn("[whatsapp:webhook] phone_number_id sem conta apta", {
          phoneNumberId,
          motivo: conta == null ? "conta-inexistente" : "conta-inapta",
        });
        continue;
      }

      reconhecidos.push({ phoneNumberId, clinicaId: conta.clinicaId });
    }

    return { reconhecidos, descartados };
  }
}
