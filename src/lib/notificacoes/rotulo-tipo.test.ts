import { describe, expect, it } from "vitest";

import { TIPOS_NOTIFICACAO } from "@/core/notificacao/domain/StatusEnvio";

import { rotuloTipoNotificacao } from "./rotulo-tipo";

describe("rotuloTipoNotificacao", () => {
  it("traduz cada tipo conhecido para rótulo amigável, nunca o enum cru", () => {
    const esperados: Record<(typeof TIPOS_NOTIFICACAO)[number], string> = {
      aviso_aumento_preco: "Aviso de preço",
      lembrete_consulta: "Lembrete de consulta",
      trial_acabando: "Trial acabando",
      cobranca_vencida: "Cobrança vencida",
      convite_usuario: "Convite",
      novo_agendamento_publico_pendente: "Novo agendamento pelo link",
    };

    for (const tipo of TIPOS_NOTIFICACAO) {
      const rotulo = rotuloTipoNotificacao(tipo);
      expect(rotulo).toBe(esperados[tipo]);
      expect(rotulo).not.toBe(tipo);
      expect(rotulo).not.toMatch(/_/);
    }
  });

  it("usa fallback genérico para tipo desconhecido", () => {
    expect(rotuloTipoNotificacao("tipo_inventado")).toBe("Notificação");
  });
});
