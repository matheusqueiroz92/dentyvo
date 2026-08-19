const SDK_SCRIPT_ID = "facebook-jssdk";
const SDK_SRC = "https://connect.facebook.net/en_US/sdk.js";

type FbLoginResponse = {
  authResponse?: { code?: string } | null;
  status?: string;
};

type FacebookSdk = {
  init(options: {
    appId: string;
    autoLogAppEvents?: boolean;
    xfbml?: boolean;
    version: string;
  }): void;
  login(
    callback: (response: FbLoginResponse) => void,
    options: Record<string, unknown>,
  ): void;
};

declare global {
  interface Window {
    FB?: FacebookSdk;
    fbAsyncInit?: () => void;
  }
}

export class EmbeddedSignupCanceladoError extends Error {
  readonly nome = "EmbeddedSignupCanceladoError" as const;

  constructor() {
    super("Conexão cancelada antes da conclusão do fluxo da Meta.");
    this.name = this.nome;
  }
}

export type EmbeddedSignupConfig = {
  appId: string;
  configurationId: string;
  /** Mesma versão usada pelo servidor, para o SDK não divergir da Graph API. */
  graphApiVersion: string;
};

/**
 * Carrega e inicializa o SDK JS da Meta uma única vez por documento.
 * Resolve com a instância pronta para `login`.
 */
export function carregarFacebookSdk(
  config: EmbeddedSignupConfig,
): Promise<FacebookSdk> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("Embedded Signup só pode ser iniciado no browser."),
    );
  }

  const inicializar = (sdk: FacebookSdk) => {
    sdk.init({
      appId: config.appId,
      autoLogAppEvents: true,
      xfbml: false,
      version: config.graphApiVersion,
    });
    return sdk;
  };

  if (window.FB) {
    return Promise.resolve(inicializar(window.FB));
  }

  return new Promise((resolve, reject) => {
    const existente = document.getElementById(SDK_SCRIPT_ID);
    const script =
      existente instanceof HTMLScriptElement
        ? existente
        : Object.assign(document.createElement("script"), {
            id: SDK_SCRIPT_ID,
            src: SDK_SRC,
            async: true,
            defer: true,
            crossOrigin: "anonymous",
          });

    script.addEventListener("load", () => {
      if (!window.FB) {
        reject(new Error("SDK da Meta carregou sem expor FB."));
        return;
      }
      resolve(inicializar(window.FB));
    });
    script.addEventListener("error", () =>
      reject(new Error("Não foi possível carregar o SDK da Meta.")),
    );

    if (!existente) {
      document.body.appendChild(script);
    }
  });
}

/**
 * Abre o popup oficial de Embedded Signup e resolve com o código OAuth.
 *
 * O `waba_id` e o `phone_number_id` não são lidos aqui de propósito: o
 * servidor os deriva do próprio token (`debug_token` + `phone_numbers`), então
 * o browser nunca precisa ser fonte de verdade sobre qual número foi conectado.
 */
export async function abrirEmbeddedSignup(
  config: EmbeddedSignupConfig,
): Promise<string> {
  const sdk = await carregarFacebookSdk(config);

  return new Promise((resolve, reject) => {
    sdk.login(
      (response) => {
        const code = response?.authResponse?.code?.trim();
        if (!code) {
          reject(new EmbeddedSignupCanceladoError());
          return;
        }
        resolve(code);
      },
      {
        config_id: config.configurationId,
        response_type: "code",
        override_default_response_type: true,
        extras: { setup: {}, featureType: "", sessionInfoVersion: "3" },
      },
    );
  });
}
