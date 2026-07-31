import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TemaClinicaPicker } from "@/components/auth/TemaClinicaPicker";

describe("TemaClinicaPicker", () => {
  it("permite selecionar um tema", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TemaClinicaPicker value="azul-padrao" onChange={onChange} />);

    await user.click(screen.getByRole("radio", { name: /Verde/i }));
    expect(onChange).toHaveBeenCalledWith("verde");
  });
});
