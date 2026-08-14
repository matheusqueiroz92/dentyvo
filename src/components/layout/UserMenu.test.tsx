import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: { signOut: vi.fn() },
}));

import { UserMenu } from "./UserMenu";

describe("UserMenu", () => {
  it("oferece atalho para a aba Conta acima de Sair", async () => {
    const user = userEvent.setup();
    render(<UserMenu nome="Ana" papel="admin" />);

    await user.click(screen.getByRole("button", { name: "Menu do usuário: Ana" }));

    const conta = await screen.findByRole("menuitem", { name: "Minha conta" });
    const sair = screen.getByRole("menuitem", { name: "Sair" });
    expect(conta.compareDocumentPosition(sair) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    await user.click(conta);
    expect(push).toHaveBeenCalledWith("/configuracoes?aba=conta");
  });
});
