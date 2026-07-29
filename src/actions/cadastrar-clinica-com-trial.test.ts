import { describe, expect, it, vi } from "vitest";

import { cadastrarClinicaComTrial } from "@/actions/cadastrar-clinica-com-trial";
import { FakeAssinaturaRepository } from "@/core/assinatura/application/test-doubles/fakes";
import { IniciarTrial } from "@/core/assinatura/application/use-cases/IniciarTrial";
import { CriarClinicaComAdmin } from "@/core/auth/application/use-cases/CriarClinicaComAdmin";
import {
  CPF_VALIDO,
  FakeAuthPort,
  FakeClinicaRepository,
  FakeProfissionalRepository,
} from "@/core/auth/application/test-doubles/fakes";

/**
 * Teste de integração no nível da action/orquestração de delivery
 * (não use case isolado): CriarClinicaComAdmin + IniciarTrial.
 */
describe("cadastrarClinicaComTrial (delivery — orquestração 001→010)", () => {
  function criarDeps(overrides?: {
    iniciarTrial?: Pick<IniciarTrial, "executar">;
    logError?: (mensagem: string, erro: unknown) => void;
  }) {
    const clinicaRepo = new FakeClinicaRepository();
    const profissionalRepo = new FakeProfissionalRepository();
    const auth = new FakeAuthPort();
    const assinaturaRepo = new FakeAssinaturaRepository();

    const criarClinicaComAdmin = new CriarClinicaComAdmin(
      clinicaRepo,
      profissionalRepo,
      auth,
    );
    const iniciarTrial =
      overrides?.iniciarTrial ?? new IniciarTrial(assinaturaRepo);

    return {
      clinicaRepo,
      profissionalRepo,
      auth,
      assinaturaRepo,
      deps: {
        criarClinicaComAdmin,
        iniciarTrial,
        logError: overrides?.logError,
      },
    };
  }

  const inputBase = {
    clinica: {
      nome: "Clínica Orquestração",
      endereco: "Rua Delivery, 1",
      tipoDocumento: "cpf" as const,
      documento: CPF_VALIDO,
    },
    admin: {
      nome: "Admin Orquestra",
      email: "admin.orquestra@teste.local",
      senha: "senha-segura-123",
    },
  };

  it("cadastro bem-sucedido resulta em Assinatura com status trialing", async () => {
    const { deps, clinicaRepo, assinaturaRepo } = criarDeps();

    const clinica = await cadastrarClinicaComTrial(deps, inputBase);

    expect(clinica.status).toBe("ativa");
    expect(await clinicaRepo.buscarPorId(clinica.id)).not.toBeNull();

    const assinatura = await assinaturaRepo.buscarPorClinicaId(clinica.id);
    expect(assinatura).not.toBeNull();
    expect(assinatura!.status).toBe("trialing");
    expect(assinatura!.clinicaId).toBe(clinica.id);
  });

  it("se IniciarTrial falhar, a clínica ainda é criada (sem rollback)", async () => {
    const logs: Array<{ mensagem: string; erro: unknown }> = [];
    const iniciarTrialQuebrado = {
      executar: vi.fn(async () => {
        throw new Error("gateway/trial indisponível (simulado)");
      }),
    };

    const { deps, clinicaRepo, assinaturaRepo } = criarDeps({
      iniciarTrial: iniciarTrialQuebrado,
      logError: (mensagem, erro) => {
        logs.push({ mensagem, erro });
      },
    });

    const clinica = await cadastrarClinicaComTrial(deps, {
      ...inputBase,
      admin: {
        ...inputBase.admin,
        email: "admin.falha-trial@teste.local",
      },
    });

    expect(clinica.status).toBe("ativa");
    expect(await clinicaRepo.buscarPorId(clinica.id)).not.toBeNull();
    expect(await assinaturaRepo.buscarPorClinicaId(clinica.id)).toBeNull();
    expect(iniciarTrialQuebrado.executar).toHaveBeenCalledOnce();
    expect(logs.length).toBe(1);
    expect(logs[0]?.mensagem).toContain(clinica.id);
  });
});
