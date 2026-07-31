import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatusAgendamentoBadge } from "./StatusAgendamentoBadge";

describe("StatusAgendamentoBadge", () => {
  it.each([
    ["pendente", "Aguardando"],
    ["confirmado", "Confirmada"],
    ["cancelado", "Cancelada"],
    ["realizado", "Finalizada"],
    ["faltou", "Faltou"],
  ] as const)("exibe rótulo textual para status %s", (status, label) => {
    render(<StatusAgendamentoBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
