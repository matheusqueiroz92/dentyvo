import { describe, expect, it } from "vitest";

import { DadosInvalidosError } from "@/core/shared/errors";

import { Agendamento } from "./Agendamento";
import { DuracaoInvalidaError, SobreposicaoHorarioError, TransicaoStatusInvalidaError } from "./errors";

function utc(h: number, m = 0) {
  return new Date(Date.UTC(2026, 6, 27, h, m, 0));
}

function criar(input: {
  id?: string;
  profissionalId?: string;
  inicio: Date;
  duracaoMinutos?: number;
  origem?: "painel" | "whatsapp-bot" | "link-publico";
}) {
  return Agendamento.criar({
    id: input.id ?? "ag-1",
    clinicaId: "clinica-1",
    pacienteId: "pac-1",
    profissionalId: input.profissionalId ?? "prof-1",
    procedimentoId: "proc-1",
    dataHoraInicio: input.inicio,
    duracaoMinutos: input.duracaoMinutos ?? 60,
    origem: input.origem ?? "painel",
  });
}

describe("Agendamento", () => {
  it("cria em status pendente com origem e fim calculado", () => {
    const ag = criar({ inicio: utc(9), origem: "whatsapp-bot", duracaoMinutos: 30 });
    expect(ag.status).toBe("pendente");
    expect(ag.origem).toBe("whatsapp-bot");
    expect(ag.dataHoraFim.getTime()).toBe(utc(9, 30).getTime());
  });

  it("rejeita duração inválida na criação", () => {
    expect(() => criar({ inicio: utc(9), duracaoMinutos: 20 })).toThrow(
      DuracaoInvalidaError,
    );
  });

  it("rejeita origem inválida", () => {
    expect(() =>
      Agendamento.criar({
        id: "ag-1",
        clinicaId: "clinica-1",
        pacienteId: "pac-1",
        profissionalId: "prof-1",
        procedimentoId: "proc-1",
        dataHoraInicio: utc(9),
        duracaoMinutos: 30,
        origem: "telefone" as "painel",
      }),
    ).toThrow(DadosInvalidosError);
  });

  describe("sobreposição half-open do mesmo profissional", () => {
    it("permite agendamentos contíguos", () => {
      const a = criar({ id: "a", inicio: utc(9), duracaoMinutos: 60 });
      const b = criar({ id: "b", inicio: utc(10), duracaoMinutos: 60 });
      expect(a.sobrepoe(b)).toBe(false);
      expect(() => b.assertSemSobreposicaoCom([a])).not.toThrow();
    });

    it("bloqueia interseção de 1 minuto", () => {
      const a = criar({ id: "a", inicio: utc(9), duracaoMinutos: 60 });
      const b = criar({ id: "b", inicio: utc(9, 59), duracaoMinutos: 30 });
      expect(a.sobrepoe(b)).toBe(true);
      expect(() => b.assertSemSobreposicaoCom([a])).toThrow(
        SobreposicaoHorarioError,
      );
    });

    it("bloqueia o mesmo intervalo (limites exatamente iguais)", () => {
      const a = criar({ id: "a", inicio: utc(9), duracaoMinutos: 60 });
      const b = criar({ id: "b", inicio: utc(9), duracaoMinutos: 60 });
      expect(a.sobrepoe(b)).toBe(true);
    });

    it("cancelado não ocupa slot e não conflita", () => {
      const ativo = criar({ id: "a", inicio: utc(9), duracaoMinutos: 60 });
      const cancelado = criar({
        id: "b",
        inicio: utc(9),
        duracaoMinutos: 60,
      }).cancelar("desmarcou");
      expect(cancelado.status).toBe("cancelado");
      expect(cancelado.ocupaSlot()).toBe(false);
      expect(ativo.sobrepoe(cancelado)).toBe(false);
      expect(() => ativo.assertSemSobreposicaoCom([cancelado])).not.toThrow();
    });

    it("não conflita com profissional diferente no mesmo horário", () => {
      const a = criar({
        id: "a",
        profissionalId: "prof-1",
        inicio: utc(9),
      });
      const b = criar({
        id: "b",
        profissionalId: "prof-2",
        inicio: utc(9),
      });
      expect(a.sobrepoe(b)).toBe(false);
    });
  });

  describe("transições de status", () => {
    it("confirma apenas de pendente para confirmado", () => {
      const confirmado = criar({ inicio: utc(9) }).confirmar();
      expect(confirmado.status).toBe("confirmado");
      expect(confirmado.ocupaSlot()).toBe(true);
      expect(() => confirmado.confirmar()).toThrow(TransicaoStatusInvalidaError);
    });

    it("cancela registrando motivo opcional e libera o slot", () => {
      const cancelado = criar({ inicio: utc(9) }).cancelar("paciente pediu");
      expect(cancelado.motivoCancelamento).toBe("paciente pediu");
      expect(cancelado.ocupaSlot()).toBe(false);
    });

    it("remarca mantendo status que ocupa slot", () => {
      const remarcado = criar({ inicio: utc(9) })
        .confirmar()
        .remarcar(utc(14), 45);
      expect(remarcado.status).toBe("confirmado");
      expect(remarcado.dataHoraInicio.getTime()).toBe(utc(14).getTime());
      expect(remarcado.dataHoraFim.getTime()).toBe(utc(14, 45).getTime());
    });
  });
});
