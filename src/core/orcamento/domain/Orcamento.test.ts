import { describe, expect, it } from "vitest";

import type { SnapshotCabecalhoDocumentoProps } from "@/core/shared/SnapshotCabecalhoDocumento";
import { TenantMismatchError } from "@/core/shared/errors";

import { ItemOrcamento } from "./ItemOrcamento";
import { Orcamento } from "./Orcamento";
import {
  OrcamentoSemItensError,
  OrcamentoStatusInvalidoError,
} from "./errors";

const cabecalhoValido: SnapshotCabecalhoDocumentoProps = {
  clinicaNome: "Clínica Sorriso",
  clinicaEndereco: "Rua A, 100",
  profissionalNome: "Dra. Ana",
  profissionalCro: "12345",
  pacienteNome: "Ana Paciente",
  pacienteCpf: "39053344705",
  pacienteDataNascimento: new Date("1990-05-15T12:00:00.000Z"),
  profissionalEspecialidade: "Ortodontia",
};

function emitirValido(
  override: Partial<{
    id: string;
    itens: Array<{
      procedimentoId: string;
      nome: string;
      valor: number;
      quantidade?: number;
    }>;
    validoAte: Date | null;
    emitidoEm: Date;
    cabecalho: SnapshotCabecalhoDocumentoProps;
  }> = {},
): Orcamento {
  return Orcamento.emitir({
    id: "orc-1",
    clinicaId: "clinica-1",
    prontuarioId: "pront-1",
    profissionalId: "prof-1",
    itens: [
      {
        procedimentoId: "proc-1",
        nome: "Limpeza",
        valor: 150,
        quantidade: 1,
      },
    ],
    cabecalho: cabecalhoValido,
    ...override,
  });
}

describe("Orcamento", () => {
  it("emite com status enviado e congela itens e cabeçalho", () => {
    const orcamento = emitirValido({
      emitidoEm: new Date("2026-08-12T15:00:00.000Z"),
    });

    expect(orcamento.status).toBe("enviado");
    expect(orcamento.estaEnviado()).toBe(true);
    expect(orcamento.itens).toHaveLength(1);
    expect(orcamento.itens[0]!.nome).toBe("Limpeza");
    expect(orcamento.itens[0]!.valor).toBe(150);
    expect(orcamento.cabecalho.profissionalCro).toBe("12345");
    expect(orcamento.validoAte).toBeNull();
  });

  it("calcula total como soma dos subtotais dos itens", () => {
    const orcamento = emitirValido({
      itens: [
        {
          procedimentoId: "proc-1",
          nome: "Limpeza",
          valor: 150,
          quantidade: 2,
        },
        {
          procedimentoId: "proc-2",
          nome: "Restauração",
          valor: 200,
          quantidade: 1,
        },
      ],
    });

    expect(orcamento.total).toBe(500);
  });

  it("rejeita emissão sem itens", () => {
    expect(() => emitirValido({ itens: [] })).toThrow(OrcamentoSemItensError);
  });

  it("aceita validoAte opcional sem alterar status", () => {
    const prazo = new Date("2026-09-01T00:00:00.000Z");
    const comPrazo = emitirValido({ validoAte: prazo });
    const semPrazo = emitirValido({ validoAte: null });

    expect(comPrazo.status).toBe("enviado");
    expect(comPrazo.validoAte).toEqual(prazo);
    expect(semPrazo.status).toBe("enviado");
    expect(semPrazo.validoAte).toBeNull();
  });

  it("passagem de validoAte não muda status sozinha (sem expiração automática)", () => {
    const vencido = emitirValido({
      validoAte: new Date("2020-01-01T00:00:00.000Z"),
      emitidoEm: new Date("2026-08-12T12:00:00.000Z"),
    });

    expect(vencido.status).toBe("enviado");
    expect(vencido.estaEnviado()).toBe(true);
    expect(vencido.estaAceito()).toBe(false);
  });

  it("aceitar transiciona enviado → aceito e preserva conteúdo", () => {
    const original = emitirValido({
      validoAte: new Date("2026-09-01T00:00:00.000Z"),
    });
    const aceito = original.aceitar();

    expect(aceito.status).toBe("aceito");
    expect(aceito.estaAceito()).toBe(true);
    expect(aceito.itens[0]!.nome).toBe(original.itens[0]!.nome);
    expect(aceito.itens[0]!.valor).toBe(original.itens[0]!.valor);
    expect(aceito.validoAte).toEqual(original.validoAte);
    expect(aceito.cabecalho.clinicaNome).toBe(original.cabecalho.clinicaNome);
    expect(original.status).toBe("enviado");
  });

  it("recusar transiciona enviado → recusado e preserva conteúdo", () => {
    const original = emitirValido();
    const recusado = original.recusar();

    expect(recusado.status).toBe("recusado");
    expect(recusado.itens).toHaveLength(1);
    expect(original.status).toBe("enviado");
  });

  it("não aceita orçamento que já não está enviado", () => {
    const aceito = emitirValido().aceitar();
    expect(() => aceito.aceitar()).toThrow(OrcamentoStatusInvalidoError);
    expect(() => aceito.recusar()).toThrow(OrcamentoStatusInvalidoError);
  });

  it("não recusa orçamento que já não está enviado", () => {
    const recusado = emitirValido().recusar();
    expect(() => recusado.recusar()).toThrow(OrcamentoStatusInvalidoError);
    expect(() => recusado.aceitar()).toThrow(OrcamentoStatusInvalidoError);
  });

  it("snapshot de item permanece estável após mutação do objeto de entrada", () => {
    const itemInput = {
      procedimentoId: "proc-1",
      nome: "Limpeza",
      valor: 150,
      quantidade: 1,
    };
    const orcamento = emitirValido({ itens: [itemInput] });
    itemInput.nome = "Nome Alterado Depois";
    itemInput.valor = 999;

    expect(orcamento.itens[0]!.nome).toBe("Limpeza");
    expect(orcamento.itens[0]!.valor).toBe(150);
  });

  it("isola tenant via assertPertenceAClinica", () => {
    const orcamento = emitirValido();
    expect(() => orcamento.assertPertenceAClinica("outra-clinica")).toThrow(
      TenantMismatchError,
    );
  });

  it("reconstitui orçamento já aceito sem reabrir transição", () => {
    const reconstituido = Orcamento.reconstituir({
      id: "orc-2",
      clinicaId: "clinica-1",
      prontuarioId: "pront-1",
      profissionalId: "prof-1",
      status: "aceito",
      itens: [
        ItemOrcamento.criar({
          procedimentoId: "proc-1",
          nome: "Limpeza",
          valor: 150,
        }),
      ],
      cabecalho: cabecalhoValido,
      validoAte: null,
      emitidoEm: new Date("2026-08-01T10:00:00.000Z"),
    });

    expect(reconstituido.status).toBe("aceito");
    expect(() => reconstituido.recusar()).toThrow(OrcamentoStatusInvalidoError);
  });
});
