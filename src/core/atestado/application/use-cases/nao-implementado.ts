/**
 * Marcador de assinatura ainda não implementada (Arquiteto de Domínio / spec 006b).
 * O Engenheiro de Testes escreve os testes (red); o Implementador preenche o corpo.
 */
export class CasoDeUsoNaoImplementadoError extends Error {
  readonly nome = "CasoDeUsoNaoImplementadoError" as const;

  constructor(readonly casoDeUso: string) {
    super(`${casoDeUso} ainda não implementado (spec 006b).`);
    this.name = this.nome;
  }
}
