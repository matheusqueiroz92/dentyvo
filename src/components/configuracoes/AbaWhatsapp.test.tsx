import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const obterStatus = vi.fn();
const iniciar = vi.fn();
const concluir = vi.fn();
const desconectar = vi.fn();
const abrirPopup = vi.fn();

vi.mock("@/actions/whatsapp", () => ({
  obterStatusWhatsappAction: () => obterStatus(),
  iniciarConexaoWhatsappAction: () => iniciar(),
  concluirConexaoWhatsappAction: (input: unknown) => concluir(input),
  desconectarWhatsappAction: () => desconectar(),
}));

vi.mock("@/lib/whatsapp/embedded-signup", () => ({
  EmbeddedSignupCanceladoError: class EmbeddedSignupCanceladoError extends Error {
    readonly nome = "EmbeddedSignupCanceladoError";
  },
  abrirEmbeddedSignup: (...args: unknown[]) => abrirPopup(...args),
}));

import { AbaWhatsapp } from "./AbaWhatsapp";

const MENSAGEM_MULTIPLOS_NUMEROS =
  "A conta WhatsApp Business conectada tem mais de um número. A clínica precisa deixar apenas um número associado a essa conta no Meta Business Manager e tentar conectar de novo.";

describe("AbaWhatsapp — fluxo Conectar", () => {
  beforeEach(() => {
    obterStatus.mockReset();
    iniciar.mockReset();
    concluir.mockReset();
    desconectar.mockReset();
    abrirPopup.mockReset();

    obterStatus.mockResolvedValue({
      data: {
        papel: "admin",
        status: {
          status: "desconectado",
          phoneNumberId: null,
          conectadoEmIso: null,
          tokenExpiraEmIso: null,
        },
      },
    });
  });

  it("exibe a mensagem de WABA com múltiplos números no fluxo de conexão, não um erro genérico", async () => {
    iniciar.mockResolvedValue({
      data: {
        appId: "app-1",
        configurationId: "cfg-1",
        graphApiVersion: "v26.0",
      },
    });
    abrirPopup.mockResolvedValue("codigo-oauth");
    concluir.mockResolvedValue({
      serverError: {
        codigo: "MultiplosNumerosNoWabaNaoSuportadoError",
        mensagem: MENSAGEM_MULTIPLOS_NUMEROS,
      },
    });

    const user = userEvent.setup();
    render(<AbaWhatsapp />);

    await user.click(
      await screen.findByRole("button", { name: "Conectar WhatsApp" }),
    );

    const alerta = await screen.findByRole("alert");
    expect(alerta).toHaveTextContent(/mais de um número/i);
    expect(alerta).toHaveTextContent(/apenas um número/i);
    expect(alerta).not.toHaveTextContent(
      /Não foi possível concluir a operação/i,
    );
  });
});
