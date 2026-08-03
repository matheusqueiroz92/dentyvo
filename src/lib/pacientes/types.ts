export type PacienteDTO = {
  id: string;
  nome: string;
  /** Apenas dígitos. */
  cpf: string;
  /** Apenas dígitos. */
  telefone: string;
  /** YYYY-MM-DD (data civil, sem fuso). */
  dataNascimentoIso: string;
  contatoEmergencia: string | null;
};
