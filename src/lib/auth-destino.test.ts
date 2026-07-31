import { describe, expect, it, vi } from "vitest";

import {
  determinarDestinoAuth,
  resolverDestinoPosCallbackSocial,
} from "@/lib/auth-destino";

describe("resolverDestinoPosCallbackSocial", () => {
  it("sem sessão volta ao login (falha OAuth genérica)", () => {
    expect(
      resolverDestinoPosCallbackSocial({
        temSessao: false,
        destinoApp: null,
      }),
    ).toBe("/login");
  });

  it("conta completa Profissional vai para /dashboard", () => {
    expect(
      resolverDestinoPosCallbackSocial({
        temSessao: true,
        destinoApp: "/dashboard",
      }),
    ).toBe("/dashboard");
  });

  it("conta completa plataforma vai para /admin", () => {
    expect(
      resolverDestinoPosCallbackSocial({
        temSessao: true,
        destinoApp: "/admin",
      }),
    ).toBe("/admin");
  });

  it("sessão sem clínica/plataforma inicia onboarding em /cadastro", () => {
    expect(
      resolverDestinoPosCallbackSocial({
        temSessao: true,
        destinoApp: null,
      }),
    ).toBe("/cadastro");
  });
});

describe("determinarDestinoAuth", () => {
  it("UsuarioPlataforma tem prioridade e vai para /admin", async () => {
    const destino = await determinarDestinoAuth(
      {
        buscarUsuarioPlataformaPorId: vi.fn().mockResolvedValue({ id: "u1" }),
        buscarUsuarioPlataformaPorEmail: vi.fn(),
        buscarProfissionalPorUsuarioId: vi
          .fn()
          .mockResolvedValue({ id: "p1" }),
      },
      { usuarioId: "u1", email: "admin@dentyvo.com" },
    );

    expect(destino).toBe("/admin");
  });

  it("UsuarioPlataforma encontrado só por e-mail vai para /admin", async () => {
    const destino = await determinarDestinoAuth(
      {
        buscarUsuarioPlataformaPorId: vi.fn().mockResolvedValue(null),
        buscarUsuarioPlataformaPorEmail: vi
          .fn()
          .mockResolvedValue({ id: "plat-1" }),
        buscarProfissionalPorUsuarioId: vi.fn().mockResolvedValue(null),
      },
      { usuarioId: "auth-1", email: "  Super@Dentyvo.com " },
    );

    expect(destino).toBe("/admin");
  });

  it("Profissional sem vínculo de plataforma vai para /dashboard", async () => {
    const destino = await determinarDestinoAuth(
      {
        buscarUsuarioPlataformaPorId: vi.fn().mockResolvedValue(null),
        buscarUsuarioPlataformaPorEmail: vi.fn().mockResolvedValue(null),
        buscarProfissionalPorUsuarioId: vi
          .fn()
          .mockResolvedValue({ id: "prof-1" }),
      },
      { usuarioId: "u2", email: "dentista@clinica.com" },
    );

    expect(destino).toBe("/dashboard");
  });

  it("sem Profissional nem UsuarioPlataforma retorna null (conta órfã)", async () => {
    const destino = await determinarDestinoAuth(
      {
        buscarUsuarioPlataformaPorId: vi.fn().mockResolvedValue(null),
        buscarUsuarioPlataformaPorEmail: vi.fn().mockResolvedValue(null),
        buscarProfissionalPorUsuarioId: vi.fn().mockResolvedValue(null),
      },
      { usuarioId: "orfao", email: "alguem@gmail.com" },
    );

    expect(destino).toBeNull();
  });
});
