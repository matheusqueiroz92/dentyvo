/**
 * Helpers de CPF para UI — espelham a regra do VO `Cpf` do domínio.
 * A validação final de aceite continua no servidor.
 */

export function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
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

export function cpfEhValido(bruto: string): boolean {
  const valor = apenasDigitos(bruto);
  return valor.length === 11 && cpfValido(valor);
}

/** Máscara de digitação: 000.000.000-00 */
export function mascararCpfInput(bruto: string): string {
  const d = apenasDigitos(bruto).slice(0, 11);
  const p1 = d.slice(0, 3);
  const p2 = d.slice(3, 6);
  const p3 = d.slice(6, 9);
  const p4 = d.slice(9, 11);
  if (d.length <= 3) return p1;
  if (d.length <= 6) return `${p1}.${p2}`;
  if (d.length <= 9) return `${p1}.${p2}.${p3}`;
  return `${p1}.${p2}.${p3}-${p4}`;
}

export function formatarCpfCompleto(cpfDigitos: string): string {
  const d = apenasDigitos(cpfDigitos);
  if (d.length !== 11) return cpfDigitos;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/**
 * Lista: mascarado por padrão (LGPD / tela compartilhada na recepção).
 * Ex.: 390.***.***-05 — primeiros 3 + últimos 2.
 */
export function formatarCpfMascarado(cpfDigitos: string): string {
  const d = apenasDigitos(cpfDigitos);
  if (d.length !== 11) return cpfDigitos;
  return `${d.slice(0, 3)}.***.***-${d.slice(9)}`;
}
