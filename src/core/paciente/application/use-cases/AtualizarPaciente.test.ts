import { describe, expect, expectTypeOf, it } from "vitest";

import { PermissaoNegadaError, TenantMismatchError } from "@/core/shared/errors";

import { PacienteNaoEncontradoError } from "../../domain/errors";
import { Paciente } from "../../domain/Paciente";
import {
  CPF_VALIDO_PACIENTE,
  FakePacienteRepository,
} from "../test-doubles/fakes";
import {
  AtualizarPaciente,
  type AtualizarPacienteDados,
  type AtualizarPacienteInput,
} from "./AtualizarPaciente";
import { seedSolicitante } from "./helpers-test";

const nascimentoOriginal = new Date("1990-05-15T12:00:00.000Z");
const nascimentoNovo = new Date("1991-08-20T12:00:00.000Z");

async function seedPacienteNaClinica(
  clinicaId: string,
  pacienteRepo: FakePacienteRepository,
  overrides: Partial<Parameters<typeof Paciente.criar>[0]> = {},
) {
  const paciente = Paciente.criar({
    id: "pac-1",
    clinicaId,
    nome: "Ana Original",
    cpf: CPF_VALIDO_PACIENTE,
    telefone: "77999990000",
    dataNascimento: nascimentoOriginal,
    contatoEmergencia: "Contato antigo",
    ...overrides,
  });
  await pacienteRepo.salvar(paciente);
  return paciente;
}

describe("AtualizarPaciente", () => {
  it("AtualizarPacienteDados não expõe campo cpf (CPF imutável na assinatura)", () => {
    expectTypeOf<AtualizarPacienteDados>().toHaveProperty("nome");
    expectTypeOf<AtualizarPacienteDados>().toHaveProperty("telefone");
    expectTypeOf<AtualizarPacienteDados>().toHaveProperty("dataNascimento");
    expectTypeOf<AtualizarPacienteDados>().not.toHaveProperty("cpf");
    expectTypeOf<AtualizarPacienteInput["dados"]>().not.toHaveProperty("cpf");
  });

  it.each(["admin", "dentista", "recepcao"] as const)(
    "%s pode atualizar nome, telefone, nascimento e contato na própria clínica",
    async (papel) => {
      const ctx = await seedSolicitante(papel);
      const original = await seedPacienteNaClinica(
        ctx.clinicaId,
        ctx.pacienteRepo,
      );
      const sut = new AtualizarPaciente(
        ctx.pacienteRepo,
        ctx.profissionalRepo,
      );

      const atualizado = await sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        pacienteId: original.id,
        dados: {
          nome: "Ana Atualizada",
          telefone: "(77) 98888-7777",
          dataNascimento: nascimentoNovo,
          contatoEmergencia: "Maria (mãe)",
        },
      });

      expect(atualizado.id).toBe(original.id);
      expect(atualizado.clinicaId).toBe(ctx.clinicaId);
      expect(atualizado.nome).toBe("Ana Atualizada");
      expect(atualizado.telefone).toBe("77988887777");
      expect(atualizado.dataNascimento).toEqual(nascimentoNovo);
      expect(atualizado.contatoEmergencia).toBe("Maria (mãe)");
      expect(atualizado.cpf.valor).toBe(CPF_VALIDO_PACIENTE);

      const persistido = await ctx.pacienteRepo.buscarPorId(
        ctx.clinicaId,
        original.id,
      );
      expect(persistido?.nome).toBe("Ana Atualizada");
      expect(persistido?.cpf.valor).toBe(CPF_VALIDO_PACIENTE);
    },
  );

  it("preserva o CPF original após atualizar os demais campos", async () => {
    const ctx = await seedSolicitante("recepcao");
    const original = await seedPacienteNaClinica(
      ctx.clinicaId,
      ctx.pacienteRepo,
    );
    const sut = new AtualizarPaciente(ctx.pacienteRepo, ctx.profissionalRepo);

    const atualizado = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      pacienteId: original.id,
      dados: {
        nome: "Nome Novo",
        telefone: "77911112222",
        dataNascimento: nascimentoNovo,
        contatoEmergencia: null,
      },
    });

    expect(atualizado.cpf.equals(original.cpf)).toBe(true);
    expect(atualizado.contatoEmergencia).toBeNull();
  });

  it("não permite atualizar paciente informando clínica diferente da do solicitante", async () => {
    const ctx = await seedSolicitante("admin");
    const original = await seedPacienteNaClinica(
      ctx.clinicaId,
      ctx.pacienteRepo,
    );
    const sut = new AtualizarPaciente(ctx.pacienteRepo, ctx.profissionalRepo);

    await expect(
      sut.executar({
        clinicaId: "outra-clinica",
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        pacienteId: original.id,
        dados: {
          nome: "X",
          telefone: "77999990000",
          dataNascimento: nascimentoNovo,
        },
      }),
    ).rejects.toBeInstanceOf(TenantMismatchError);
  });

  it("não atualiza paciente de outra clínica (trata como não encontrado)", async () => {
    const ctx = await seedSolicitante("admin");
    const deOutra = await seedPacienteNaClinica("clinica-outra", ctx.pacienteRepo, {
      id: "pac-outro",
      nome: "De Fora",
    });
    const sut = new AtualizarPaciente(ctx.pacienteRepo, ctx.profissionalRepo);

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        pacienteId: deOutra.id,
        dados: {
          nome: "Tentativa",
          telefone: "77999990000",
          dataNascimento: nascimentoNovo,
        },
      }),
    ).rejects.toBeInstanceOf(PacienteNaoEncontradoError);

    const intacto = await ctx.pacienteRepo.buscarPorId(
      "clinica-outra",
      deOutra.id,
    );
    expect(intacto?.nome).toBe("De Fora");
  });

  it("nega atualização quando o solicitante não tem vínculo profissional", async () => {
    const ctx = await seedSolicitante("admin");
    const original = await seedPacienteNaClinica(
      ctx.clinicaId,
      ctx.pacienteRepo,
    );
    const sut = new AtualizarPaciente(ctx.pacienteRepo, ctx.profissionalRepo);

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: "usuario-inexistente",
        pacienteId: original.id,
        dados: {
          nome: "X",
          telefone: "77999990000",
          dataNascimento: nascimentoNovo,
        },
      }),
    ).rejects.toBeInstanceOf(PermissaoNegadaError);
  });
});
