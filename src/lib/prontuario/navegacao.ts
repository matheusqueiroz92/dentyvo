export function caminhoProntuarioDoPaciente(pacienteId: string): string {
  return `/pacientes/${pacienteId}?aba=prontuario`;
}
