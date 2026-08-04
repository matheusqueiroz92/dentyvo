import { DadosInvalidosError } from "@/core/shared/errors";

export const ROTULO_PROCEDIMENTO_CATCH_ALL = "Consulta/Avaliação";
export const MIN_ITENS_MENU_PUBLICO = 2;
export const MAX_ITENS_MENU_PUBLICO = 4;

export type ItemMenuPublicoProcedimento = {
  rotuloPublico: string;
  procedimentoId: string;
};

export type MenuPublicoProcedimentoProps = {
  clinicaId: string;
  itens: readonly ItemMenuPublicoProcedimento[];
};

/**
 * Menu curto exposto no link público — fachada de rótulos para `Procedimento`
 * já cadastrado (sem catálogo paralelo). Configurado: 2–4 itens; vazio =
 * aplicação usa catch-all "Consulta/Avaliação".
 */
export class MenuPublicoProcedimento {
  readonly clinicaId: string;
  readonly itens: readonly ItemMenuPublicoProcedimento[];

  private constructor(props: MenuPublicoProcedimentoProps) {
    this.clinicaId = props.clinicaId;
    this.itens = props.itens;
  }

  /** Menu ainda não configurado pela clínica (catch-all na application). */
  static vazio(clinicaId: string): MenuPublicoProcedimento {
    return new MenuPublicoProcedimento({ clinicaId, itens: [] });
  }

  /**
   * Configuração explícita do menu público (2–4 itens).
   * Pertencimento dos `procedimentoId` ao tenant é validado na application.
   */
  static configurar(
    clinicaId: string,
    itens: ItemMenuPublicoProcedimento[],
  ): MenuPublicoProcedimento {
    const normalizados = normalizarItens(itens);
    if (
      normalizados.length < MIN_ITENS_MENU_PUBLICO ||
      normalizados.length > MAX_ITENS_MENU_PUBLICO
    ) {
      throw new DadosInvalidosError(
        `Menu público deve ter entre ${MIN_ITENS_MENU_PUBLICO} e ${MAX_ITENS_MENU_PUBLICO} opções.`,
      );
    }
    return new MenuPublicoProcedimento({
      clinicaId,
      itens: normalizados,
    });
  }

  static reconstituir(props: MenuPublicoProcedimentoProps): MenuPublicoProcedimento {
    if (props.itens.length === 0) {
      return MenuPublicoProcedimento.vazio(props.clinicaId);
    }
    return MenuPublicoProcedimento.configurar(props.clinicaId, [...props.itens]);
  }

  get estaConfigurado(): boolean {
    return this.itens.length > 0;
  }

  contemProcedimento(procedimentoId: string): boolean {
    return this.itens.some((i) => i.procedimentoId === procedimentoId);
  }
}

function normalizarItens(
  itens: ItemMenuPublicoProcedimento[],
): ItemMenuPublicoProcedimento[] {
  const vistos = new Set<string>();
  const resultado: ItemMenuPublicoProcedimento[] = [];

  for (const item of itens) {
    const rotuloPublico = item.rotuloPublico.trim();
    const procedimentoId = item.procedimentoId.trim();
    if (!rotuloPublico) {
      throw new DadosInvalidosError(
        "Rótulo público do item do menu é obrigatório.",
      );
    }
    if (!procedimentoId) {
      throw new DadosInvalidosError(
        "procedimentoId do item do menu é obrigatório.",
      );
    }
    if (vistos.has(procedimentoId)) {
      throw new DadosInvalidosError(
        "Menu público não pode mapear o mesmo procedimento mais de uma vez.",
      );
    }
    vistos.add(procedimentoId);
    resultado.push({ rotuloPublico, procedimentoId });
  }

  return resultado;
}
