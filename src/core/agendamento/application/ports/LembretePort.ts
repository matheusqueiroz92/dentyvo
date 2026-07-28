/**
 * Stub de lembrete (spec 002): apenas registra intenção de envio.
 * Envio real (WhatsApp/e-mail + job) fica fora de escopo.
 */
export type IntencaoLembrete = {
  agendamentoId: string;
  clinicaId: string;
  pacienteId: string;
  profissionalId: string;
  dataHoraConsulta: Date;
  /** Momento previsto para envio (consulta − antecedência). */
  dataHoraEnvioPrevisto: Date;
};

export interface LembretePort {
  /**
   * Best-effort: falha aqui NÃO deve desfazer o agendamento persistido.
   */
  registrarIntencao(intencao: IntencaoLembrete): Promise<void>;
}
