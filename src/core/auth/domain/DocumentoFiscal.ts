import { DocumentoFiscalInvalidoError } from "./errors";

export type TipoDocumentoFiscal = "cpf" | "cnpj";

/**
 * Value object do documento fiscal da clínica (CPF ou CNPJ).
 * Normaliza para apenas dígitos e valida tamanho + dígitos verificadores.
 */
export class DocumentoFiscal {
  private constructor(
    readonly tipo: TipoDocumentoFiscal,
    readonly valor: string,
  ) {}

  static criar(tipo: TipoDocumentoFiscal, bruto: string): DocumentoFiscal {
    const valor = bruto.replace(/\D/g, "");

    if (tipo === "cpf") {
      if (valor.length !== 11 || !cpfValido(valor)) {
        throw new DocumentoFiscalInvalidoError(tipo, bruto);
      }
    } else if (valor.length !== 14 || !cnpjValido(valor)) {
      throw new DocumentoFiscalInvalidoError(tipo, bruto);
    }

    return new DocumentoFiscal(tipo, valor);
  }

  equals(outro: DocumentoFiscal): boolean {
    return this.tipo === outro.tipo && this.valor === outro.valor;
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

function cnpjValido(cnpj: string): boolean {
  if (todosDigitosIguais(cnpj)) return false;

  const calc = (base: string, pesos: number[]): number => {
    const soma = base
      .split("")
      .reduce((acc, digito, i) => acc + Number(digito) * pesos[i]!, 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const d1 = calc(cnpj.slice(0, 12), pesos1);
  const d2 = calc(cnpj.slice(0, 13), pesos2);
  return d1 === Number(cnpj[12]) && d2 === Number(cnpj[13]);
}
