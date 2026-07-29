import { describe, expect, it } from "vitest";

import {
  NotificacaoNaoEncontradaError,
  NotificacaoNaoPertenceAoDestinatarioError,
} from "../../domain/errors";
import {
  criarNotificacaoFake,
  FakeNotificacaoRepository,
} from "../test-doubles/fakes";
import { MarcarComoLida } from "./MarcarComoLida";

describe("MarcarComoLida", () => {
  it("marca como lida quando o solicitante é o destinatário", async () => {
    const repo = new FakeNotificacaoRepository();
    const n = criarNotificacaoFake({
      id: "n-1",
      destinatario: { kind: "usuario", usuarioId: "user-1" },
    });
    await repo.salvar(n);

    const sut = new MarcarComoLida(repo);
    const agora = new Date("2026-07-01T16:00:00.000Z");
    const atualizada = await sut.executar({
      notificacaoId: "n-1",
      destinatarioSessao: { kind: "usuario", usuarioId: "user-1" },
      agora,
    });

    expect(atualizada.lida).toBe(true);
    expect(atualizada.lidaEm).toEqual(agora);
    expect(repo.items.get("n-1")?.lida).toBe(true);
  });

  it("nega se outro usuário de clínica tentar marcar (RBAC)", async () => {
    const repo = new FakeNotificacaoRepository();
    await repo.salvar(
      criarNotificacaoFake({
        id: "n-1",
        destinatario: { kind: "usuario", usuarioId: "user-1" },
      }),
    );

    const sut = new MarcarComoLida(repo);
    await expect(
      sut.executar({
        notificacaoId: "n-1",
        destinatarioSessao: { kind: "usuario", usuarioId: "user-intruso" },
      }),
    ).rejects.toBeInstanceOf(NotificacaoNaoPertenceAoDestinatarioError);

    expect(repo.items.get("n-1")?.lida).toBe(false);
  });

  it("super-admin não marca notificação de usuário de clínica (sem cross-tenant)", async () => {
    const repo = new FakeNotificacaoRepository();
    await repo.salvar(
      criarNotificacaoFake({
        id: "n-clinica",
        destinatario: { kind: "usuario", usuarioId: "user-clinica" },
      }),
    );

    const sut = new MarcarComoLida(repo);
    await expect(
      sut.executar({
        notificacaoId: "n-clinica",
        destinatarioSessao: {
          kind: "usuario_plataforma",
          usuarioPlataformaId: "super-1",
        },
      }),
    ).rejects.toBeInstanceOf(NotificacaoNaoPertenceAoDestinatarioError);
  });

  it("falha se a notificação não existe", async () => {
    const sut = new MarcarComoLida(new FakeNotificacaoRepository());
    await expect(
      sut.executar({
        notificacaoId: "inexistente",
        destinatarioSessao: { kind: "usuario", usuarioId: "user-1" },
      }),
    ).rejects.toBeInstanceOf(NotificacaoNaoEncontradaError);
  });
});
