import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LogoUploadField } from "@/components/auth/LogoUploadField";

describe("LogoUploadField", () => {
  it("renderiza label e hint", () => {
    render(<LogoUploadField value={null} onChange={vi.fn()} />);
    expect(screen.getByText(/Logo da clínica/)).toBeInTheDocument();
    expect(screen.getByText(/até 2 MB/)).toBeInTheDocument();
  });
});
