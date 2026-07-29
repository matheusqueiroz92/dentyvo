import { describe, expect, it } from "vitest";

import {
  criarNotificacaoFake,
  FakeNotificacaoRepository,
} from "../test-doubles/fakes";
import { ListarNotificacoesNaoLidas } from "./ListarNotificacoesNaoLidas";

describe("ListarNotificacoesNaoLidas", () => {
  it("lista apenas não lidas do destinatário da sessão", async () => {
    const repo = new FakeNotificacaoRepository();
    const propria = criarNotificacaoFake({
      id: "n-eu",
      destinatario: { kind: "usuario", usuarioId: "user-1" },
    });
    const deOutro = criarNotificacaoFake({
      id: "n-outro",
      destinatario: { kind: "usuario", usuarioId: "user-2" },
      chaveNegocio: "cob-outro",
    });
    const jaLida = criarNotificacaoFake({
      id: "n-lida",
      destinatario: { kind: "usuario", usuarioId: "user-1" },
      chaveNegocio: "cob-lida",
    }).marcarComoLida(new Date("2026-07-01T12:00:00.000Z"));

    await repo.salvar(propria);
    await repo.salvar(deOutro);
    await repo.salvar(jaLida);

    const sut = new ListarNotificacoesNaoLidas(repo);
    const lista = await sut.executar({
      destinatarioSessao: { kind: "usuario", usuarioId: "user-1" },
    });

    expect(lista.map((n) => n.id)).toEqual(["n-eu"]);
  });

  it("super-admin (UsuarioPlataforma) não vê notificações de usuário de clínica", async () => {
    const repo = new FakeNotificacaoRepository();
    await repo.salvar(
      criarNotificacaoFake({
        id: "n-clinica",
        destinatario: { kind: "usuario", usuarioId: "user-clinica" },
      }),
    );
    await repo.salvar(
      criarNotificacaoFake({
        id: "n-plat",
        destinatario: {
          kind: "usuario_plataforma",
          usuarioPlataformaId: "super-1",
        },
        chaveNegocio: "plat-1",
        tipo: "aviso_aumento_preco",
      }),
    );

    const sut = new ListarNotificacoesNaoLidas(repo);
    const comoSuperAdmin = await sut.executar({
      destinatarioSessao: {
        kind: "usuario_plataforma",
        usuarioPlataformaId: "super-1",
      },
    });

    expect(comoSuperAdmin.map((n) => n.id)).toEqual(["n-plat"]);
    expect(comoSuperAdmin.every((n) => n.destinatarioUsuarioId == null)).toBe(
      true,
    );
  });
});
