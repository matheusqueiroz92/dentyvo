import { afterEach, describe, expect, it, vi } from "vitest";

import { Notificacao } from "../../domain/Notificacao";
import {
  FakeAuditoriaLogPort,
  FakeNotificacaoCanalPort,
  FakeNotificacaoRepository,
} from "../test-doubles/fakes";
import { EnviarNotificacao } from "./EnviarNotificacao";

const DEST = { kind: "usuario" as const, usuarioId: "user-1" };

function sut(comAuditoria = false) {
  const repo = new FakeNotificacaoRepository();
  const canais = new FakeNotificacaoCanalPort();
  const auditoria = comAuditoria ? new FakeAuditoriaLogPort() : undefined;
  return {
    repo,
    canais,
    auditoria,
    useCase: new EnviarNotificacao(repo, canais, auditoria),
  };
}

describe("EnviarNotificacao", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("persiste e despacha canais, marcando statusEnvio como enviada", async () => {
    const { repo, canais, useCase } = sut();
    const agora = new Date("2026-07-01T12:00:00.000Z");

    const result = await useCase.executar({
      id: "notif-1",
      destinatario: DEST,
      tipo: "cobranca_vencida",
      conteudo: { titulo: "Cobrança vencida", cobrancaId: "cob-1" },
      canais: ["email", "in_app"],
      chaveNegocio: "cob-1",
      agora,
    });

    expect(result.statusDoCanal("email")).toBe("enviada");
    expect(result.statusDoCanal("in_app")).toBe("enviada");
    expect(canais.despachos).toHaveLength(2);
    expect(repo.items.get("notif-1")?.statusDoCanal("email")).toBe("enviada");
  });

  it("dedup no mesmo balde: segundo envio devolve a existente sem re-despachar", async () => {
    const { repo, canais, useCase } = sut();

    const primeira = await useCase.executar({
      id: "notif-1",
      destinatario: DEST,
      tipo: "cobranca_vencida",
      conteudo: { titulo: "Cobrança", cobrancaId: "cob-1" },
      canais: ["email"],
      chaveNegocio: "cob-1",
      agora: new Date("2026-07-01T12:15:00.000Z"),
    });

    const despachosAposPrimeira = canais.despachos.length;

    const segunda = await useCase.executar({
      id: "notif-2",
      destinatario: DEST,
      tipo: "cobranca_vencida",
      conteudo: { titulo: "Cobrança de novo", cobrancaId: "cob-1" },
      canais: ["email"],
      chaveNegocio: "cob-1",
      agora: new Date("2026-07-01T12:45:00.000Z"),
    });

    expect(segunda.id).toBe(primeira.id);
    expect(canais.despachos).toHaveLength(despachosAposPrimeira);
    expect(repo.items.size).toBe(1);

    const conflito = await repo.criarSeNaoDuplicada(
      Notificacao.criar({
        id: "notif-3",
        destinatario: DEST,
        tipo: "cobranca_vencida",
        canais: ["email"],
        conteudo: { titulo: "x", cobrancaId: "cob-1" },
        chaveNegocio: "cob-1",
        criadaEm: new Date("2026-07-01T12:50:00.000Z"),
      }),
    );
    expect(conflito.criada).toBe(false);
    expect(conflito.notificacao.id).toBe(primeira.id);
  });

  it("fora do balde (12:59 → 13:01) permite novo envio mesmo com ~2 min de diferença", async () => {
    const { repo, canais, useCase } = sut();

    await useCase.executar({
      id: "notif-antes",
      destinatario: DEST,
      tipo: "cobranca_vencida",
      conteudo: { titulo: "Antes", cobrancaId: "cob-1" },
      canais: ["email"],
      chaveNegocio: "cob-1",
      agora: new Date("2026-07-01T12:59:00.000Z"),
    });

    const depois = await useCase.executar({
      id: "notif-depois",
      destinatario: DEST,
      tipo: "cobranca_vencida",
      conteudo: { titulo: "Depois", cobrancaId: "cob-1" },
      canais: ["email"],
      chaveNegocio: "cob-1",
      agora: new Date("2026-07-01T13:01:00.000Z"),
    });

    expect(depois.id).toBe("notif-depois");
    expect(repo.items.size).toBe(2);
    expect(canais.despachos).toHaveLength(2);
  });

  it("criarSeNaoDuplicada em conflito retorna criada: false sem lançar erro", async () => {
    const repo = new FakeNotificacaoRepository();

    const original = Notificacao.criar({
      id: "orig",
      destinatario: DEST,
      tipo: "trial_acabando",
      canais: ["in_app"],
      conteudo: { titulo: "Trial", assinaturaId: "ass-1" },
      chaveNegocio: "ass-1",
      criadaEm: new Date("2026-07-01T10:00:00.000Z"),
    });
    const primeiro = await repo.criarSeNaoDuplicada(original);
    expect(primeiro.criada).toBe(true);

    const duplicata = Notificacao.criar({
      id: "dup",
      destinatario: DEST,
      tipo: "trial_acabando",
      canais: ["in_app"],
      conteudo: { titulo: "Trial outra vez", assinaturaId: "ass-1" },
      chaveNegocio: "ass-1",
      criadaEm: new Date("2026-07-01T10:30:00.000Z"),
    });

    await expect(repo.criarSeNaoDuplicada(duplicata)).resolves.toEqual({
      notificacao: original,
      criada: false,
    });
    expect(repo.items.size).toBe(1);
  });

  it("falha no canal marca statusEnvio falhou sem retry automático", async () => {
    const { canais, useCase } = sut();
    canais.canaisQueFalham.add("email");

    const result = await useCase.executar({
      id: "notif-fail",
      destinatario: DEST,
      tipo: "aviso_aumento_preco",
      conteudo: { titulo: "Preço", planoId: "plano-1" },
      canais: ["email", "in_app"],
      chaveNegocio: "promo-1",
      agora: new Date("2026-07-01T12:00:00.000Z"),
    });

    expect(result.statusDoCanal("email")).toBe("falhou");
    expect(result.statusDoCanal("in_app")).toBe("enviada");
    expect(() => result.marcarCanalComoEnviado("email")).toThrow();
  });

  it("não reenvia canais quando dedup devolve criada: false", async () => {
    const { canais, useCase } = sut();
    canais.canaisQueFalham.add("email");

    await useCase.executar({
      id: "n1",
      destinatario: DEST,
      tipo: "cobranca_vencida",
      conteudo: { titulo: "A", cobrancaId: "c1" },
      canais: ["email"],
      chaveNegocio: "c1",
      agora: new Date("2026-07-01T14:00:00.000Z"),
    });

    const falhasAntes = canais.despachos.length;
    canais.canaisQueFalham.clear();

    const segunda = await useCase.executar({
      id: "n2",
      destinatario: DEST,
      tipo: "cobranca_vencida",
      conteudo: { titulo: "B", cobrancaId: "c1" },
      canais: ["email"],
      chaveNegocio: "c1",
      agora: new Date("2026-07-01T14:20:00.000Z"),
    });

    expect(segunda.statusDoCanal("email")).toBe("falhou");
    expect(canais.despachos.length).toBe(falhasAntes);
  });

  describe("auditoria (R1 / R2)", () => {
    it("falha de canal gera AuditoriaLog com recurso notificacao e detalhe sem PHI", async () => {
      const { canais, auditoria, useCase } = sut(true);
      canais.canaisQueFalham.add("email");

      await useCase.executar({
        id: "notif-aud-fail",
        destinatario: DEST,
        tipo: "cobranca_vencida",
        conteudo: { titulo: "Cobrança", cobrancaId: "cob-9" },
        canais: ["email", "in_app"],
        chaveNegocio: "cob-9",
        agora: new Date("2026-07-01T12:00:00.000Z"),
        atorUsuarioId: "user-1",
        clinicaId: "clinica-1",
        atorProfissionalId: "prof-1",
      });

      expect(auditoria!.eventos).toHaveLength(1);
      const evento = auditoria!.eventos[0]!;
      expect(evento.acao).toBe("escrita");
      expect(evento.recursoTipo).toBe("notificacao");
      expect(evento.recursoId).toBe("notif-aud-fail");
      expect(evento.detalhe).toEqual({
        notificacaoId: "notif-aud-fail",
        tipoNotificacao: "cobranca_vencida",
        canalNotificacao: "email",
        statusEnvio: "falhou",
      });
      expect(JSON.stringify(evento.detalhe)).not.toContain("descricao");
      expect(JSON.stringify(evento.detalhe)).not.toContain("paciente");
    });

    it("sucesso de envio NÃO gera auditoria (R1)", async () => {
      const { auditoria, useCase } = sut(true);

      await useCase.executar({
        id: "notif-ok",
        destinatario: DEST,
        tipo: "trial_acabando",
        conteudo: { titulo: "Trial", assinaturaId: "ass-1" },
        canais: ["email", "in_app"],
        chaveNegocio: "ass-1",
        agora: new Date("2026-07-01T12:00:00.000Z"),
        atorUsuarioId: "user-1",
        clinicaId: "clinica-1",
        atorProfissionalId: "prof-1",
      });

      expect(auditoria!.eventos).toHaveLength(0);
    });

    it("ator incompleto: warn, sem erro, envio completa (R2)", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { canais, auditoria, useCase } = sut(true);
      canais.canaisQueFalham.add("email");

      const result = await useCase.executar({
        id: "notif-ator-incompleto",
        destinatario: DEST,
        tipo: "aviso_aumento_preco",
        conteudo: { titulo: "Preço", planoId: "plano-1" },
        canais: ["email", "in_app"],
        chaveNegocio: "promo-2",
        agora: new Date("2026-07-01T12:00:00.000Z"),
        atorUsuarioId: "user-1",
        // sem atorProfissionalId nem atorUsuarioPlataformaId
      });

      expect(result.statusDoCanal("email")).toBe("falhou");
      expect(result.statusDoCanal("in_app")).toBe("enviada");
      expect(auditoria!.eventos).toHaveLength(0);
      expect(warnSpy).toHaveBeenCalledWith(
        "auditoria de falha de notificação ignorada: ator incompleto",
        { notificacaoId: "notif-ator-incompleto" },
      );
    });
  });
});
