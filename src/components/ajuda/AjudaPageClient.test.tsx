import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CONTATO_EMAIL, WHATSAPP_COMERCIAL } from "@/lib/contato/canais";
import { FAQS_APP } from "@/lib/ajuda/faq";

import { AjudaPageClient } from "./AjudaPageClient";

describe("AjudaPageClient", () => {
  it("mostra FAQ, canais de suporte e formulário com nome da sessão", () => {
    render(<AjudaPageClient usuarioNome="Dr. Paulo" />);

    expect(
      screen.getByRole("heading", { name: "Ajuda e suporte" }),
    ).toBeInTheDocument();

    for (const item of FAQS_APP) {
      expect(screen.getByText(item.pergunta)).toBeInTheDocument();
    }

    const email = screen.getByRole("link", { name: new RegExp(CONTATO_EMAIL) });
    expect(email).toHaveAttribute("href", `mailto:${CONTATO_EMAIL}`);

    const whatsapp = screen.getByRole("link", {
      name: new RegExp(WHATSAPP_COMERCIAL.label, "i"),
    });
    expect(whatsapp).toHaveAttribute("href", WHATSAPP_COMERCIAL.url);

    expect(screen.getByLabelText("Nome")).toHaveValue("Dr. Paulo");
    expect(screen.getByRole("radio", { name: "Bug" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Dúvida" })).toBeInTheDocument();
  });
});
