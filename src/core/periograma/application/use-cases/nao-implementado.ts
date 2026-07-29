/**
 * Marcador de assinatura ainda não implementada (Arquiteto de Domínio / spec 005).
 * O Engenheiro de Testes escreve os testes (red); o Implementador preenche o corpo.
 */
export class CasoDeUsoNaoImplementadoError extends Error {
  readonly nome = "CasoDeUsoNaoImplementadoError" as const;

  constructor(readonly casoDeUso: string) {
    super(`${casoDeUso} ainda não implementado (spec 005).`);
    this.name = this.nome;
  }
}
