import { describe, expect, it } from "vitest";

import { Profissional } from "@/core/auth/domain/Profissional";
import { ProntuarioNaoEncontradoError } from "@/core/prontuario/domain/errors";
import { PermissaoNegadaError, TenantMismatchError } from "@/core/shared/errors";

import {
  CidFormatoInvalidoError,
  CroAusenteNaEmissaoError,
  PeriodoAfastamentoInvalidoError,
} from "../../domain/errors";
import { EmitirAtestado } from "./EmitirAtestado";
import { seedContextoAtestado } from "./helpers-test";

const DATA_INICIO = new Date("2026-08-11T00:00:00.000Z");

describe("EmitirAtestado", () => {
  it("dentista emite atestado com snapshot de cabeçalho a partir dos cadastros", async () => {
    const ctx = await seedContextoAtestado("dentista");
    const sut = new EmitirAtestado(
      ctx.atestadoRepo,
      ctx.prontuarioRepo,
      ctx.clinicaRepo,
      ctx.profissionalRepo,
      ctx.pacienteRepo,
    );

    const atestado = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      prontuarioId: ctx.prontuario.id,
      motivo: "repouso pós-procedimento",
      dataInicio: DATA_INICIO,
      quantidadeDias: 3,
    });

    expect(atestado.profissionalId).toBe(ctx.profissional.id);
    expect(atestado.assinaturaDigitalId).toBeNull();
    expect(atestado).not.toHaveProperty("itens");
    expect(atestado.cabecalho.clinicaNome).toBe(ctx.clinica.nome);
    expect(atestado.cabecalho.clinicaEndereco).toBe(ctx.clinica.endereco);
    expect(atestado.cabecalho.profissionalNome).toBe(ctx.profissional.nome);
    expect(atestado.cabecalho.profissionalCro).toBe(ctx.profissional.cro);
    expect(atestado.cabecalho.profissionalEspecialidade).toBe(
      ctx.profissional.especialidade,
    );
    expect(atestado.cabecalho.pacienteNome).toBe(ctx.paciente.nome);
    expect(atestado.cabecalho.pacienteCpf).toBe(ctx.paciente.cpf.valor);
    expect(atestado.cabecalho.pacienteDataNascimento).toEqual(
      ctx.paciente.dataNascimento,
    );
    expect(
      await ctx.atestadoRepo.buscarPorId(ctx.clinicaId, atestado.id),
    ).not.toBeNull();
  });

  it("usa profissionalId da sessão, não um id arbitrário", async () => {
    const ctx = await seedContextoAtestado("dentista");
    const sut = new EmitirAtestado(
      ctx.atestadoRepo,
      ctx.prontuarioRepo,
      ctx.clinicaRepo,
      ctx.profissionalRepo,
      ctx.pacienteRepo,
    );

    const atestado = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      prontuarioId: ctx.prontuario.id,
      motivo: "acompanhamento odontológico",
      dataInicio: DATA_INICIO,
      quantidadeDias: 1,
    });

    expect(atestado.profissionalId).toBe(ctx.profissional.id);
    expect(atestado.profissionalId).not.toBe("prof-arbitrario");
  });

  it.each(["K08.1", "K081"] as const)(
    "aceita CID de formato válido %s",
    async (cid) => {
      const ctx = await seedContextoAtestado("dentista");
      const sut = new EmitirAtestado(
        ctx.atestadoRepo,
        ctx.prontuarioRepo,
        ctx.clinicaRepo,
        ctx.profissionalRepo,
        ctx.pacienteRepo,
      );

      const atestado = await sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        prontuarioId: ctx.prontuario.id,
        motivo: "repouso pós-procedimento",
        cid,
        dataInicio: DATA_INICIO,
        quantidadeDias: 2,
      });

      expect(atestado.cid).toBe(cid);
    },
  );

  it("aceita CID ausente ou vazio (campo opcional)", async () => {
    const ctx = await seedContextoAtestado("dentista");
    const sut = new EmitirAtestado(
      ctx.atestadoRepo,
      ctx.prontuarioRepo,
      ctx.clinicaRepo,
      ctx.profissionalRepo,
      ctx.pacienteRepo,
    );

    const semCampo = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      prontuarioId: ctx.prontuario.id,
      motivo: "comparecimento à consulta",
      dataInicio: DATA_INICIO,
      quantidadeDias: 1,
    });
    const vazio = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      prontuarioId: ctx.prontuario.id,
      motivo: "comparecimento à consulta",
      cid: "  ",
      dataInicio: DATA_INICIO,
      quantidadeDias: 1,
    });

    expect(semCampo.cid).toBeNull();
    expect(vazio.cid).toBeNull();
  });

  it("rejeita CID com formato inválido na emissão", async () => {
    const ctx = await seedContextoAtestado("dentista");
    const sut = new EmitirAtestado(
      ctx.atestadoRepo,
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
        motivo: "repouso",
        cid: "08",
        dataInicio: DATA_INICIO,
        quantidadeDias: 1,
      }),
    ).rejects.toBeInstanceOf(CidFormatoInvalidoError);
  });

  it("persiste dataFim inclusiva em data civil (início + dias - 1, sem hora)", async () => {
    const ctx = await seedContextoAtestado("dentista");
    const sut = new EmitirAtestado(
      ctx.atestadoRepo,
      ctx.prontuarioRepo,
      ctx.clinicaRepo,
      ctx.profissionalRepo,
      ctx.pacienteRepo,
    );

    const atestado = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      prontuarioId: ctx.prontuario.id,
      motivo: "repouso pós-procedimento",
      dataInicio: new Date("2026-08-11T18:20:00.000Z"),
      quantidadeDias: 3,
    });

    expect(atestado.dataInicio).toEqual(new Date("2026-08-11T00:00:00.000Z"));
    expect(atestado.dataFim).toEqual(new Date("2026-08-13T00:00:00.000Z"));
    expect(atestado.quantidadeDias).toBe(3);
    expect(atestado.dataInicio.getUTCHours()).toBe(0);
    expect(atestado.dataFim.getUTCHours()).toBe(0);
  });

  it("rejeita quantidadeDias menor que 1", async () => {
    const ctx = await seedContextoAtestado("dentista");
    const sut = new EmitirAtestado(
      ctx.atestadoRepo,
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
        motivo: "repouso",
        dataInicio: DATA_INICIO,
        quantidadeDias: 0,
      }),
    ).rejects.toBeInstanceOf(PeriodoAfastamentoInvalidoError);
  });

  it("congela snapshot mesmo se cadastros mudarem depois da emissão", async () => {
    const ctx = await seedContextoAtestado("dentista");
    const sut = new EmitirAtestado(
      ctx.atestadoRepo,
      ctx.prontuarioRepo,
      ctx.clinicaRepo,
      ctx.profissionalRepo,
      ctx.pacienteRepo,
    );

    const atestado = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      prontuarioId: ctx.prontuario.id,
      motivo: "repouso pós-procedimento",
      dataInicio: DATA_INICIO,
      quantidadeDias: 2,
    });

    const clinicaAlterada = ctx.clinica.atualizarDadosCadastrais({
      nome: "Clínica Renomeada",
      endereco: "Outra Rua, 1",
    });
    await ctx.clinicaRepo.salvar(clinicaAlterada);

    const persistida = await ctx.atestadoRepo.buscarPorId(
      ctx.clinicaId,
      atestado.id,
    );
    expect(persistida?.cabecalho.clinicaNome).toBe("Clínica Sorriso");
    expect(persistida?.cabecalho.clinicaEndereco).toBe("Rua A, 100");
  });

  it("admin da clínica não emite atestado (ato atestante exige CRO / papel dentista)", async () => {
    const ctx = await seedContextoAtestado("admin");
    const sut = new EmitirAtestado(
      ctx.atestadoRepo,
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
        motivo: "repouso",
        dataInicio: DATA_INICIO,
        quantidadeDias: 1,
      }),
    ).rejects.toBeInstanceOf(PermissaoNegadaError);
  });

  it.each(["admin", "recepcao"] as const)(
    "%s não emite atestado",
    async (papel) => {
      const ctx = await seedContextoAtestado(papel);
      const sut = new EmitirAtestado(
        ctx.atestadoRepo,
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
          motivo: "repouso",
          dataInicio: DATA_INICIO,
          quantidadeDias: 1,
        }),
      ).rejects.toBeInstanceOf(PermissaoNegadaError);
    },
  );

  it("falha quando prontuário não existe na clínica", async () => {
    const ctx = await seedContextoAtestado("dentista");
    const sut = new EmitirAtestado(
      ctx.atestadoRepo,
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
        motivo: "repouso",
        dataInicio: DATA_INICIO,
        quantidadeDias: 1,
      }),
    ).rejects.toBeInstanceOf(ProntuarioNaoEncontradoError);
  });

  it("isola por tenant", async () => {
    const ctx = await seedContextoAtestado("dentista");
    const sut = new EmitirAtestado(
      ctx.atestadoRepo,
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
        motivo: "repouso",
        dataInicio: DATA_INICIO,
        quantidadeDias: 1,
      }),
    ).rejects.toBeInstanceOf(TenantMismatchError);
  });

  it("não emite sem CRO no profissional da sessão", async () => {
    const ctx = await seedContextoAtestado("dentista");
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

    const sut = new EmitirAtestado(
      ctx.atestadoRepo,
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
        motivo: "repouso",
        dataInicio: DATA_INICIO,
        quantidadeDias: 1,
      }),
    ).rejects.toBeInstanceOf(CroAusenteNaEmissaoError);
  });
});
