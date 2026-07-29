import { describe, expect, expectTypeOf, it } from "vitest";

import { DadosInvalidosError } from "@/core/shared/errors";

import {
  calcularJanelaDedup,
  JANELA_DEDUP_MS,
} from "./constants";
import {
  type ConteudoNotificacao,
  sanitizarConteudoNotificacao,
} from "./ConteudoNotificacao";
import {
  TransicaoStatusEnvioInvalidaError,
} from "./errors";
import { Notificacao } from "./Notificacao";
import {
  podeTransicionarStatusEnvio,
  TRANSICOES_STATUS_ENVIO,
} from "./StatusEnvio";

const DEST_USER: { kind: "usuario"; usuarioId: string } = {
  kind: "usuario",
  usuarioId: "user-1",
};

function criar(input?: {
  id?: string;
  chaveNegocio?: string | null;
  criadaEm?: Date;
  canais?: Array<"email" | "in_app">;
  tipo?: "cobranca_vencida" | "trial_acabando";
  destinatario?: { kind: "usuario"; usuarioId: string } | {
    kind: "usuario_plataforma";
    usuarioPlataformaId: string;
  };
}) {
  return Notificacao.criar({
    id: input?.id ?? "n-1",
    destinatario: input?.destinatario ?? DEST_USER,
    tipo: input?.tipo ?? "cobranca_vencida",
    canais: input?.canais ?? ["email"],
    conteudo: { titulo: "Aviso", cobrancaId: "cob-1" },
    chaveNegocio:
      input?.chaveNegocio === undefined ? "cob-1" : input.chaveNegocio,
    criadaEm: input?.criadaEm,
  });
}

describe("Notificacao — dedup por balde horário (spec 011)", () => {
  it("JANELA_DEDUP_MS é 1 hora", () => {
    expect(JANELA_DEDUP_MS).toBe(60 * 60 * 1000);
  });

  it("calcularJanelaDedup usa balde fixo floor(ms / 1h)", () => {
    const a = new Date("2026-07-01T12:10:00.000Z");
    const b = new Date("2026-07-01T12:59:00.000Z");
    expect(calcularJanelaDedup(a)).toBe(calcularJanelaDedup(b));
    expect(calcularJanelaDedup(a)).toBe(Math.floor(a.getTime() / JANELA_DEDUP_MS));
  });

  it("mesma identidade no mesmo balde é duplicata", () => {
    const primeira = criar({
      id: "n-a",
      criadaEm: new Date("2026-07-01T12:10:00.000Z"),
    });
    const segunda = criar({
      id: "n-b",
      criadaEm: new Date("2026-07-01T12:50:00.000Z"),
    });

    expect(primeira.ehDuplicataDe(segunda)).toBe(true);
    expect(segunda.ehDuplicataDe(primeira)).toBe(true);
    expect(primeira.janelaDedup).toBe(segunda.janelaDedup);
  });

  it("mesma identidade em baldes vizinhos NÃO é duplicata (fronteira 12:59 / 13:01)", () => {
    const quaseMeioDia = criar({
      id: "n-antes",
      criadaEm: new Date("2026-07-01T12:59:00.000Z"),
    });
    const logoApos = criar({
      id: "n-depois",
      criadaEm: new Date("2026-07-01T13:01:00.000Z"),
    });

    // ~2 min de diferença, mas atravessa a hora cheia do balde fixo
    expect(
      logoApos.criadaEm.getTime() - quaseMeioDia.criadaEm.getTime(),
    ).toBe(2 * 60 * 1000);
    expect(calcularJanelaDedup(quaseMeioDia.criadaEm)).not.toBe(
      calcularJanelaDedup(logoApos.criadaEm),
    );
    expect(quaseMeioDia.ehDuplicataDe(logoApos)).toBe(false);
  });

  it("sem chaveNegocio nunca é duplicata por identidade", () => {
    const a = criar({
      id: "n-1",
      chaveNegocio: null,
      criadaEm: new Date("2026-07-01T12:00:00.000Z"),
    });
    const b = criar({
      id: "n-2",
      chaveNegocio: null,
      criadaEm: new Date("2026-07-01T12:05:00.000Z"),
    });
    expect(a.ehDuplicataDe(b)).toBe(false);
    expect(a.janelaDedup).toBeNull();
  });

  it("destinatários diferentes não são duplicata", () => {
    const a = criar({ id: "n-1" });
    const b = criar({
      id: "n-2",
      destinatario: { kind: "usuario", usuarioId: "user-outro" },
    });
    expect(a.ehDuplicataDe(b)).toBe(false);
  });
});

describe("Notificacao — statusEnvio por canal", () => {
  it("inicia todos os canais como pendente", () => {
    const n = criar({ canais: ["email", "in_app"] });
    expect(n.statusDoCanal("email")).toBe("pendente");
    expect(n.statusDoCanal("in_app")).toBe("pendente");
  });

  it("permite pendente → enviada e pendente → falhou", () => {
    expect(podeTransicionarStatusEnvio("pendente", "enviada")).toBe(true);
    expect(podeTransicionarStatusEnvio("pendente", "falhou")).toBe(true);
    expect(TRANSICOES_STATUS_ENVIO.pendente).toEqual(["enviada", "falhou"]);

    const enviada = criar().marcarCanalComoEnviado("email");
    expect(enviada.statusDoCanal("email")).toBe("enviada");

    const falhou = criar({ id: "n-f" }).marcarCanalComoFalhou("email");
    expect(falhou.statusDoCanal("email")).toBe("falhou");
  });

  it("falhou e enviada são terminais — sem retry (falhou não volta a pendente)", () => {
    expect(TRANSICOES_STATUS_ENVIO.falhou).toEqual([]);
    expect(TRANSICOES_STATUS_ENVIO.enviada).toEqual([]);
    expect(podeTransicionarStatusEnvio("falhou", "pendente")).toBe(false);
    expect(podeTransicionarStatusEnvio("falhou", "enviada")).toBe(false);
    expect(podeTransicionarStatusEnvio("enviada", "falhou")).toBe(false);

    const falhou = criar().marcarCanalComoFalhou("email");
    expect(() => falhou.marcarCanalComoEnviado("email")).toThrow(
      TransicaoStatusEnvioInvalidaError,
    );
  });

  it("transição de um canal não altera o outro", () => {
    const n = criar({ canais: ["email", "in_app"] })
      .marcarCanalComoEnviado("email")
      .marcarCanalComoFalhou("in_app");
    expect(n.statusDoCanal("email")).toBe("enviada");
    expect(n.statusDoCanal("in_app")).toBe("falhou");
  });
});

describe("ConteudoNotificacao — sem PHI (allowlist)", () => {
  it("ConteudoNotificacao tipado não admite campos clínicos", () => {
    expectTypeOf<ConteudoNotificacao>().toHaveProperty("titulo");
    expectTypeOf<ConteudoNotificacao>().toHaveProperty("cobrancaId");
    expectTypeOf<ConteudoNotificacao>().not.toHaveProperty("descricao");
    expectTypeOf<ConteudoNotificacao>().not.toHaveProperty("respostas");
    expectTypeOf<ConteudoNotificacao>().not.toHaveProperty("pacienteNome");
    expectTypeOf<ConteudoNotificacao>().not.toHaveProperty("pacienteCpf");
    expectTypeOf<ConteudoNotificacao>().not.toHaveProperty("textoClinico");
    expectTypeOf<ConteudoNotificacao>().not.toHaveProperty("anamnese");
  });

  it("sanitizar descarta chaves clínicas injetadas em runtime", () => {
    const limpo = sanitizarConteudoNotificacao({
      titulo: "Cobrança vencida",
      cobrancaId: "cob-1",
      descricao: "Paciente com abscesso no 36",
      respostas: { alergias: "penicilina" },
      pacienteNome: "Fulano",
      pacienteCpf: "12345678901",
    } as ConteudoNotificacao & Record<string, unknown>);

    expect(limpo).toEqual({
      titulo: "Cobrança vencida",
      cobrancaId: "cob-1",
    });
    expect(JSON.stringify(limpo)).not.toContain("abscesso");
    expect(JSON.stringify(limpo)).not.toContain("penicilina");
    expect(JSON.stringify(limpo)).not.toContain("Fulano");
  });

  it("Notificacao.criar aplica sanitização no conteúdo", () => {
    const n = Notificacao.criar({
      id: "n-phi",
      destinatario: DEST_USER,
      tipo: "cobranca_vencida",
      canais: ["in_app"],
      conteudo: {
        titulo: "Aviso",
        descricao: "Evolução: canal radicular no 21",
      } as ConteudoNotificacao & Record<string, unknown>,
      chaveNegocio: "cob-x",
    });

    expect(n.conteudo).toEqual({ titulo: "Aviso" });
    expect(JSON.stringify(n.conteudo)).not.toContain("radicular");
  });

  it("rejeita valorCentavos inválido", () => {
    expect(() =>
      sanitizarConteudoNotificacao({ valorCentavos: -1 }),
    ).toThrow(DadosInvalidosError);
    expect(() =>
      sanitizarConteudoNotificacao({ valorCentavos: 1.5 }),
    ).toThrow(DadosInvalidosError);
  });
});

describe("Notificacao — autorização do destinatário", () => {
  it("pertenceAoDestinatario só para o próprio usuário", () => {
    const n = criar();
    expect(n.pertenceAoDestinatario(DEST_USER)).toBe(true);
    expect(
      n.pertenceAoDestinatario({ kind: "usuario", usuarioId: "outro" }),
    ).toBe(false);
  });

  it("usuário de clínica e UsuarioPlataforma não se confundem (sem cross-tenant)", () => {
    const deClinica = criar({
      destinatario: { kind: "usuario", usuarioId: "user-clinica" },
    });
    const dePlataforma = criar({
      id: "n-plat",
      destinatario: {
        kind: "usuario_plataforma",
        usuarioPlataformaId: "super-1",
      },
    });

    expect(
      deClinica.pertenceAoDestinatario({
        kind: "usuario_plataforma",
        usuarioPlataformaId: "super-1",
      }),
    ).toBe(false);
    expect(
      dePlataforma.pertenceAoDestinatario({
        kind: "usuario",
        usuarioId: "user-clinica",
      }),
    ).toBe(false);
  });

  it("marcarComoLida é idempotente", () => {
    const em = new Date("2026-07-01T15:00:00.000Z");
    const lida = criar().marcarComoLida(em);
    expect(lida.lida).toBe(true);
    expect(lida.lidaEm).toEqual(em);
    expect(lida.marcarComoLida(new Date())).toBe(lida);
  });
});
