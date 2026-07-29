import { ItemReceitaInvalidoError } from "./errors";

export type ItemReceitaProps = {
  medicamento: string;
  dosagem: string;
  posologia: string;
  duracao: string;
};

/**
 * Item estruturado da receita (spec 006).
 * Textos livres por campo; sem catálogo farmacológico no MVP.
 */
export class ItemReceita {
  readonly medicamento: string;
  readonly dosagem: string;
  readonly posologia: string;
  readonly duracao: string;

  private constructor(props: ItemReceitaProps) {
    this.medicamento = props.medicamento;
    this.dosagem = props.dosagem;
    this.posologia = props.posologia;
    this.duracao = props.duracao;
  }

  static criar(input: ItemReceitaProps): ItemReceita {
    return new ItemReceita({
      medicamento: assertCampo(input.medicamento, "medicamento"),
      dosagem: assertCampo(input.dosagem, "dosagem"),
      posologia: assertCampo(input.posologia, "posologia"),
      duracao: assertCampo(input.duracao, "duracao"),
    });
  }

  static reconstituir(props: ItemReceitaProps): ItemReceita {
    return new ItemReceita(props);
  }

  paraProps(): ItemReceitaProps {
    return {
      medicamento: this.medicamento,
      dosagem: this.dosagem,
      posologia: this.posologia,
      duracao: this.duracao,
    };
  }
}

function assertCampo(valor: string, campo: string): string {
  const trimmed = valor.trim();
  if (!trimmed) {
    throw new ItemReceitaInvalidoError(campo);
  }
  return trimmed;
}
