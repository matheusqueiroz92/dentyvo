import { describe, expect, it } from "vitest";

import { Profissional } from "@/core/auth/domain/Profissional";
import { ProntuarioNaoEncontradoError } from "@/core/prontuario/domain/errors";
import { PermissaoNegadaError, TenantMismatchError } from "@/core/shared/errors";

import { CroAusenteNaEmissaoError } from "../../domain/errors";
import { itemReceitaValido } from "../test-doubles/fakes";
import { EmitirReceita } from "./EmitirReceita";
import { seedContextoReceituario } from "./helpers-test";

describe("EmitirReceita", () => {
  it("dentista emite receita com snapshot de cabeçalho a partir dos cadastros", async () => {
    const ctx = await seedContextoReceituario("dentista");
    const sut = new EmitirReceita(
      ctx.receitaRepo,
      ctx.prontuarioRepo,
      ctx.clinicaRepo,
      ctx.profissionalRepo,
      ctx.pacienteRepo,
    );

    const receita = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      prontuarioId: ctx.prontuario.id,
      itens: [itemReceitaValido],
    });

    expect(receita.profissionalId).toBe(ctx.profissional.id);
    expect(receita.assinaturaDigitalId).toBeNull();
    expect(receita.cabecalho.clinicaNome).toBe(ctx.clinica.nome);
    expect(receita.cabecalho.clinicaEndereco).toBe(ctx.clinica.endereco);
    expect(receita.cabecalho.profissionalNome).toBe(ctx.profissional.nome);
    expect(receita.cabecalho.profissionalCro).toBe(ctx.profissional.cro);
    expect(receita.cabecalho.profissionalEspecialidade).toBe(
      ctx.profissional.especialidade,
    );
    expect(receita.cabecalho.pacienteNome).toBe(ctx.paciente.nome);
    expect(receita.cabecalho.pacienteCpf).toBe(ctx.paciente.cpf.valor);
    expect(receita.cabecalho.pacienteDataNascimento).toEqual(
      ctx.paciente.dataNascimento,
    );
    expect(receita.itens).toHaveLength(1);
    expect(
      await ctx.receitaRepo.buscarPorId(ctx.clinicaId, receita.id),
    ).not.toBeNull();
  });

  it("usa profissionalId da sessão, não um id arbitrário", async () => {
    const ctx = await seedContextoReceituario("dentista");
    const sut = new EmitirReceita(
      ctx.receitaRepo,
      ctx.prontuarioRepo,
      ctx.clinicaRepo,
      ctx.profissionalRepo,
      ctx.pacienteRepo,
    );

    const receita = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      prontuarioId: ctx.prontuario.id,
      itens: [itemReceitaValido],
    });

    expect(receita.profissionalId).toBe(ctx.profissional.id);
    expect(receita.profissionalId).not.toBe("prof-arbitrario");
  });

  it("congela snapshot mesmo se cadastros mudarem depois da emissão", async () => {
    const ctx = await seedContextoReceituario("dentista");
    const sut = new EmitirReceita(
      ctx.receitaRepo,
      ctx.prontuarioRepo,
      ctx.clinicaRepo,
      ctx.profissionalRepo,
      ctx.pacienteRepo,
    );

    const receita = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      prontuarioId: ctx.prontuario.id,
      itens: [itemReceitaValido],
    });

    const clinicaAlterada = ctx.clinica.atualizarDadosCadastrais({
      nome: "Clínica Renomeada",
      endereco: "Outra Rua, 1",
    });
    await ctx.clinicaRepo.salvar(clinicaAlterada);

    const persistida = await ctx.receitaRepo.buscarPorId(
      ctx.clinicaId,
      receita.id,
    );
    expect(persistida?.cabecalho.clinicaNome).toBe("Clínica Sorriso");
    expect(persistida?.cabecalho.clinicaEndereco).toBe("Rua A, 100");
  });

  it.each(["admin", "recepcao"] as const)(
    "%s não emite receita",
    async (papel) => {
      const ctx = await seedContextoReceituario(papel);
      const sut = new EmitirReceita(
        ctx.receitaRepo,
        ctx.prontuarioRepo,
        ctx.clinicaRepo,
        ctx.profissionalRepo,
        ctx.pacienteRepo,
      );

      await expect(
        sut.executar({
          clinicaId: ctx.clinicaId,
          solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
          prontuarioId: ctx.prontuario.id,
          itens: [itemReceitaValido],
        }),
      ).rejects.toBeInstanceOf(PermissaoNegadaError);
    },
  );

  it("falha quando prontuário não existe na clínica", async () => {
    const ctx = await seedContextoReceituario("dentista");
    const sut = new EmitirReceita(
      ctx.receitaRepo,
      ctx.prontuarioRepo,
      ctx.clinicaRepo,
      ctx.profissionalRepo,
      ctx.pacienteRepo,
    );

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        prontuarioId: "pront-inexistente",
        itens: [itemReceitaValido],
      }),
    ).rejects.toBeInstanceOf(ProntuarioNaoEncontradoError);
  });

  it("isola por tenant", async () => {
    const ctx = await seedContextoReceituario("dentista");
    const sut = new EmitirReceita(
      ctx.receitaRepo,
      ctx.prontuarioRepo,
      ctx.clinicaRepo,
      ctx.profissionalRepo,
      ctx.pacienteRepo,
    );

    await expect(
      sut.executar({
        clinicaId: "outra-clinica",
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        prontuarioId: ctx.prontuario.id,
        itens: [itemReceitaValido],
      }),
    ).rejects.toBeInstanceOf(TenantMismatchError);
  });

  it("não emite sem CRO no profissional da sessão", async () => {
    const ctx = await seedContextoReceituario("dentista");
    const semCro = Profissional.reconstituir({
      id: ctx.profissional.id,
      clinicaId: ctx.clinicaId,
      usuarioId: ctx.profissional.usuarioId,
      nome: ctx.profissional.nome,
      papel: "dentista",
      cro: null,
      especialidade: ctx.profissional.especialidade,
      slug: ctx.profissional.slug,
    });
    await ctx.profissionalRepo.salvar(semCro);

    const sut = new EmitirReceita(
      ctx.receitaRepo,
      ctx.prontuarioRepo,
      ctx.clinicaRepo,
      ctx.profissionalRepo,
      ctx.pacienteRepo,
    );

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        prontuarioId: ctx.prontuario.id,
        itens: [itemReceitaValido],
      }),
    ).rejects.toBeInstanceOf(CroAusenteNaEmissaoError);
  });
});
