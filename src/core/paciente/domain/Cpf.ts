import { CpfInvalidoError } from "./errors";

/**
 * Value object de CPF do paciente (apenas dígitos, com validação de DV).
 */
export class Cpf {
  private constructor(readonly valor: string) {}

  static criar(bruto: string): Cpf {
    const valor = bruto.replace(/\D/g, "");
    if (valor.length !== 11 || !cpfValido(valor)) {
      throw new CpfInvalidoError(bruto);
    }
    return new Cpf(valor);
  }

  equals(outro: Cpf): boolean {
    return this.valor === outro.valor;
  }
}

function todosDigitosIguais(digitos: string): boolean {
  return /^(\d)\1+$/.test(digitos);
}

function cpfValido(cpf: string): boolean {
  if (todosDigitosIguais(cpf)) return false;

  const calc = (base: string, fatorInicial: number): number => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) {
      soma += Number(base[i]) * (fatorInicial - i);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  const d1 = calc(cpf.slice(0, 9), 10);
  const d2 = calc(cpf.slice(0, 10), 11);
  return d1 === Number(cpf[9]) && d2 === Number(cpf[10]);
}
