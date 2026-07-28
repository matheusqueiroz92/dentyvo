import { DadosInvalidosError } from "@/core/shared/errors";

/**
 * Dados que o frontend precisa para abrir o Embedded Signup da Meta
 * (Configuration ID da plataforma como Tech Provider — spec 008).
 */
export type ConfiguracaoPopupProps = {
  appId: string;
  configurationId: string;
};

export class ConfiguracaoPopup {
  readonly appId: string;
  readonly configurationId: string;

  private constructor(props: ConfiguracaoPopupProps) {
    this.appId = props.appId;
    this.configurationId = props.configurationId;
  }

  static criar(input: ConfiguracaoPopupProps): ConfiguracaoPopup {
    const appId = input.appId.trim();
    const configurationId = input.configurationId.trim();

    if (!appId) {
      throw new DadosInvalidosError(
        "appId da configuração Embedded Signup é obrigatório.",
      );
    }
    if (!configurationId) {
      throw new DadosInvalidosError(
        "configurationId da configuração Embedded Signup é obrigatório.",
      );
    }

    return new ConfiguracaoPopup({ appId, configurationId });
  }
}
