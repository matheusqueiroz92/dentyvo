import { describe, expect, it } from "vitest";

import { PermissaoNegadaError, TenantMismatchError } from "@/core/shared/errors";
import { Clinica } from "@/core/auth/domain/Clinica";
import { DocumentoFiscal } from "@/core/auth/domain/DocumentoFiscal";
import { Profissional } from "@/core/auth/domain/Profissional";
import { CNPJ_VALIDO } from "@/core/auth/application/test-doubles/fakes";

import { Cobranca } from "../../domain/Cobranca";
import {
  LIMITE_HISTORICO_COBRANCA_PAINEL,
  PRECO_PROMOCIONAL_CENTAVOS,
} from "../../domain/constants";
import { AssinaturaNaoEncontradaError } from "../../domain/errors";
import { valorMensalPlanoEmCentavos } from "../../domain/elegibilidadePromocional";
import {
  CLINICA_ID,
  PLANO_ID,
  criarContextoAssinatura,
  seedTrialAtivo,
} from "./helpers-test";
import { ObterDetalhesAssinatura } from "./ObterDetalhesAssinatura";
import { ResolverValorCobrancaAssinatura } from "./ResolverValorCobrancaAssinatura";

const INICIO = new Date("2026-07-01T12:00:00.000Z");
const PROXIMA = new Date("2026-08-01T12:00:00.000Z");

/**
 * Monta o SUT **sem** `AssinaturaGatewayPort`.
 * `criarContextoAssinatura` ainda cria um fake de gateway para outros testes
 * do módulo; este caso de uso não o recebe — leitura 100% local.
 */
function sut(ctx: Awaited<ReturnType<typeof criarContextoAssinatura>>) {
  return new ObterDetalhesAssinatura(
    ctx.assinaturaRepo,
    ctx.planoRepo,
    ctx.cobrancaRepo,
    ctx.vagaRepo,
    ctx.profissionalRepo,
    new ResolverValorCobrancaAssinatura(ctx.assinaturaRepo, ctx.planoRepo),
  );
}

async function seedAssinaturaPaga(
  ctx: Awaited<ReturnType<typeof criarContextoAssinatura>>,
) {
  const trial = await seedTrialAtivo(ctx, INICIO);
  const paga = trial.ativarAposPagamento({
    planoId: PLANO_ID,
    gatewayClienteId: "gw-cli-1",
    gatewayAssinaturaId: "gw-sub-1",
    dataProximaCobranca: PROXIMA,
  });
  await ctx.assinaturaRepo.salvar(paga);
  return paga;
}

async function seedAssinaturaPromocional(
  ctx: Awaited<ReturnType<typeof criarContextoAssinatura>>,
) {
  const trial = await seedTrialAtivo(ctx, INICIO);
  const vaga = await ctx.vagaRepo.reservarAtomico({
    clinicaId: CLINICA_ID,
    assinaturaId: trial.id,
    agora: INICIO,
  });
  const paga = trial
    .aplicarCopiaPromocionalDaVaga({
      vaga,
      precoPromocionalCentavos: PRECO_PROMOCIONAL_CENTAVOS.basico,
    })
    .ativarAposPagamento({
      planoId: PLANO_ID,
      gatewayClienteId: "gw-cli-1",
      gatewayAssinaturaId: "gw-sub-1",
      dataProximaCobranca: PROXIMA,
    });
  await ctx.assinaturaRepo.salvar(paga);
  return { assinatura: paga, vaga };
}

function cobranca(input: {
  id: string;
  assinaturaId: string;
  vencimento: string;
  status?: "pendente" | "paga" | "vencida" | "estornada";
  linkPagamento?: string | null;
}) {
  return Cobranca.criar({
    id: input.id,
    assinaturaId: input.assinaturaId,
    gatewayCobrancaId: `gw-${input.id}`,
    valor: 59.9,
    metodo: "pix",
    vencimento: new Date(input.vencimento),
    status: input.status,
    linkPagamento: input.linkPagamento,
  });
}

describe("ObterDetalhesAssinatura", () => {
  it("trial sem plano: plano null, valor efetivo null, histórico vazio", async () => {
    const ctx = await criarContextoAssinatura();
    await seedTrialAtivo(ctx, INICIO);

    const detalhes = await sut(ctx).executar({
      clinicaId: CLINICA_ID,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      agora: new Date("2026-07-08T12:00:00.000Z"),
    });

    expect(detalhes.status).toBe("trialing");
    expect(detalhes.plano).toBeNull();
    expect(detalhes.valorEfetivoCentavos).toBeNull();
    expect(detalhes.origemValor).toBeNull();
    expect(detalhes.historicoCobranca).toEqual([]);
    expect(detalhes.precoPromocionalAte).toBeNull();
    expect(detalhes.migradaParaPrecoCheioEm).toBeNull();
    expect(detalhes.vagaPromocional).toBeNull();
    expect(detalhes.linkRegularizacao).toBeNull();
    expect(detalhes.dataProximaCobranca).toBeNull();
  });

  it("clínica sem assinatura lança AssinaturaNaoEncontradaError", async () => {
    const ctx = await criarContextoAssinatura();

    await expect(
      sut(ctx).executar({
        clinicaId: CLINICA_ID,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      }),
    ).rejects.toBeInstanceOf(AssinaturaNaoEncontradaError);
  });

  it("histórico local limitado a 12, ordenado por vencimento desc", async () => {
    const ctx = await criarContextoAssinatura();
    const assinatura = await seedAssinaturaPaga(ctx);

    for (let i = 1; i <= 15; i++) {
      const dia = String(i).padStart(2, "0");
      await ctx.cobrancaRepo.salvar(
        cobranca({
          id: `cob-${dia}`,
          assinaturaId: assinatura.id,
          vencimento: `2026-01-${dia}T12:00:00.000Z`,
          status: "paga",
        }),
      );
    }

    const detalhes = await sut(ctx).executar({
      clinicaId: CLINICA_ID,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      agora: INICIO,
    });

    expect(detalhes.historicoCobranca).toHaveLength(
      LIMITE_HISTORICO_COBRANCA_PAINEL,
    );
    expect(detalhes.historicoCobranca.map((c) => c.id)).toEqual([
      "cob-15",
      "cob-14",
      "cob-13",
      "cob-12",
      "cob-11",
      "cob-10",
      "cob-09",
      "cob-08",
      "cob-07",
      "cob-06",
      "cob-05",
      "cob-04",
    ]);
    expect(detalhes.plano).toEqual({
      nome: "Básico",
      valorMensal: 99.9,
    });
    expect(detalhes.valorEfetivoCentavos).toBe(
      valorMensalPlanoEmCentavos(ctx.plano),
    );
    expect(detalhes.origemValor).toBe("cheio");
  });

  it("linkRegularizacao vem da cobrança pendente ou vencida mais recente", async () => {
    const ctx = await criarContextoAssinatura();
    const assinatura = await seedAssinaturaPaga(ctx);

    await ctx.cobrancaRepo.salvar(
      cobranca({
        id: "paga-recente",
        assinaturaId: assinatura.id,
        vencimento: "2026-08-01T12:00:00.000Z",
        status: "paga",
        linkPagamento: "https://pagar.exemplo/paga",
      }),
    );
    await ctx.cobrancaRepo.salvar(
      cobranca({
        id: "vencida-antiga",
        assinaturaId: assinatura.id,
        vencimento: "2026-06-01T12:00:00.000Z",
        status: "vencida",
        linkPagamento: "https://pagar.exemplo/vencida",
      }),
    );
    await ctx.cobrancaRepo.salvar(
      cobranca({
        id: "pendente-meio",
        assinaturaId: assinatura.id,
        vencimento: "2026-07-01T12:00:00.000Z",
        status: "pendente",
        linkPagamento: "https://pagar.exemplo/pendente",
      }),
    );

    const detalhes = await sut(ctx).executar({
      clinicaId: CLINICA_ID,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      agora: INICIO,
    });

    expect(detalhes.linkRegularizacao).toBe("https://pagar.exemplo/pendente");
  });

  it("linkRegularizacao é null quando não há cobrança pendente nem vencida", async () => {
    const ctx = await criarContextoAssinatura();
    const assinatura = await seedAssinaturaPaga(ctx);
    await ctx.cobrancaRepo.salvar(
      cobranca({
        id: "so-paga",
        assinaturaId: assinatura.id,
        vencimento: "2026-07-01T12:00:00.000Z",
        status: "paga",
        linkPagamento: "https://pagar.exemplo/paga",
      }),
    );

    const detalhes = await sut(ctx).executar({
      clinicaId: CLINICA_ID,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      agora: INICIO,
    });

    expect(detalhes.linkRegularizacao).toBeNull();
  });

  it("devolve precoPromocionalAte e migradaParaPrecoCheioEm juntos sem alterar estado", async () => {
    const ctx = await criarContextoAssinatura();
    const { assinatura, vaga } = await seedAssinaturaPromocional(ctx);
    const migradaEm = vaga.calcularPrecoPromocionalAte();
    const migrada = assinatura.marcarMigradaParaPrecoCheio(migradaEm);
    await ctx.assinaturaRepo.salvar(migrada);

    const detalhes = await sut(ctx).executar({
      clinicaId: CLINICA_ID,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      agora: migradaEm,
    });

    expect(detalhes.precoPromocionalAte).toEqual(
      vaga.calcularPrecoPromocionalAte(),
    );
    expect(detalhes.migradaParaPrecoCheioEm).toEqual(migradaEm);
    expect(detalhes.origemValor).toBe("cheio");

    const persistida = await ctx.assinaturaRepo.buscarPorId(assinatura.id);
    expect(persistida?.precoPromocionalAte).toEqual(
      vaga.calcularPrecoPromocionalAte(),
    );
    expect(persistida?.migradaParaPrecoCheioEm).toEqual(migradaEm);
    expect(persistida?.status).toBe("ativa");
  });

  it("vagaPromocional permanece visível com assinatura cancelada (P11)", async () => {
    const ctx = await criarContextoAssinatura();
    const { assinatura, vaga } = await seedAssinaturaPromocional(ctx);
    await ctx.assinaturaRepo.salvar(
      assinatura.cancelar(new Date("2026-07-20T12:00:00.000Z")),
    );

    const detalhes = await sut(ctx).executar({
      clinicaId: CLINICA_ID,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      agora: INICIO,
    });

    expect(detalhes.status).toBe("cancelada");
    expect(detalhes.vagaPromocional).toEqual({ posicao: vaga.posicao });
    expect(await ctx.vagaRepo.buscarPorClinica(CLINICA_ID)).not.toBeNull();
  });

  it.each(["dentista", "recepcao"] as const)(
    "%s não pode obter detalhes da assinatura",
    async (papel) => {
      const ctx = await criarContextoAssinatura(papel);
      await seedTrialAtivo(ctx, INICIO);

      await expect(
        sut(ctx).executar({
          clinicaId: CLINICA_ID,
          solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        }),
      ).rejects.toBeInstanceOf(PermissaoNegadaError);
    },
  );

  it("não lê assinatura de outro tenant", async () => {
    const ctx = await criarContextoAssinatura();
    await seedTrialAtivo(ctx, INICIO);
    await ctx.clinicaRepo.salvar(
      Clinica.criar({
        id: "clinica-outra",
        nome: "Outra",
        endereco: "Rua Z",
        documento: DocumentoFiscal.criar("cnpj", CNPJ_VALIDO),
      }),
    );
    await ctx.profissionalRepo.salvar(
      Profissional.criar({
        id: "prof-outra",
        clinicaId: "clinica-outra",
        usuarioId: "user-outra",
        nome: "Outro admin",
        papel: "admin",
      }),
    );

    await expect(
      sut(ctx).executar({
        clinicaId: "clinica-outra",
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      }),
    ).rejects.toBeInstanceOf(TenantMismatchError);
  });
});
