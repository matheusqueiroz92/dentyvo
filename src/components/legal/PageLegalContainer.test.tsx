import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PageLegalContainer } from "@/components/legal/PageLegalContainer";

describe("PageLegalContainer", () => {
  it("renderiza voltar, logo, título, children e rodapé com documentos", () => {
    render(
      <PageLegalContainer title="Termos de uso">
        <p>Conteúdo específico da página</p>
      </PageLegalContainer>,
    );

    const voltar = screen.getByRole("link", { name: "Voltar" });
    expect(voltar).toHaveAttribute("href", "/");

    expect(screen.getByRole("img", { name: "Dentyvo" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Termos de uso" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Conteúdo específico da página"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/documento não revisado juridicamente/i),
    ).toBeInTheDocument();

    const rodape = screen.getByRole("contentinfo");
    expect(rodape).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Documentos legais" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Termos de uso" }),
    ).toHaveAttribute("href", "/termos");
    expect(
      screen.getByRole("link", { name: "Política de privacidade" }),
    ).toHaveAttribute("href", "/privacidade");
    expect(
      screen.getByRole("link", { name: "Política de cookies" }),
    ).toHaveAttribute("href", "/cookies");
  });
});
