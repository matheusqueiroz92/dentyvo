/**
 * Seed + checagem da aba Assinatura (4 cenários).
 * Uso: node --import tsx scripts/seed-configuracoes-assinatura.mjs
 */
import { randomUUID } from "node:crypto";
import { config } from "dotenv";
config({ path: ".env.local", override: true });

const SENHA = "SenhaDemo!Assinatura123";

function gerarCnpjValido() {
  const n = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10));
  const base = [...n, 0, 0, 0, 1];
  const digito = (digitos, pesos) => {
    const soma = digitos.reduce((acc, d, i) => acc + d * pesos[i], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const d1 = digito(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = digito([...base, d1], [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return [...base, d1, d2].join("");
}

const { CriarClinicaComAdmin } = await import(
  "../src/core/auth/application/use-cases/CriarClinicaComAdmin.ts"
);
const { ConvidarUsuario } = await import(
  "../src/core/auth/application/use-cases/ConvidarUsuario.ts"
);
const { AceitarConvite } = await import(
  "../src/core/auth/application/use-cases/AceitarConvite.ts"
);
const { createAuthModule } = await import(
  "../src/core/auth/infra/create-auth-module.ts"
);
const { IniciarTrial } = await import(
  "../src/core/assinatura/application/use-cases/IniciarTrial.ts"
);
const { ObterDetalhesAssinatura } = await import(
  "../src/core/assinatura/application/use-cases/ObterDetalhesAssinatura.ts"
);
const { ResolverValorCobrancaAssinatura } = await import(
  "../src/core/assinatura/application/use-cases/ResolverValorCobrancaAssinatura.ts"
);
const { DrizzleAssinaturaRepository } = await import(
  "../src/core/assinatura/infra/adapters/DrizzleAssinaturaRepository.ts"
);
const { DrizzleCobrancaRepository } = await import(
  "../src/core/assinatura/infra/adapters/DrizzleCobrancaRepository.ts"
);
const { DrizzlePlanoRepository } = await import(
  "../src/core/assinatura/infra/adapters/DrizzlePlanoRepository.ts"
);
const { DrizzleVagaPromocionalRepository } = await import(
  "../src/core/assinatura/infra/adapters/DrizzleVagaPromocionalRepository.ts"
);
const { Plano } = await import("../src/core/assinatura/domain/Plano.ts");
const { Cobranca } = await import("../src/core/assinatura/domain/Cobranca.ts");
const { PRECO_PROMOCIONAL_CENTAVOS } = await import(
  "../src/core/assinatura/domain/constants.ts"
);
const { db } = await import("../src/db/index.ts");

const agora = Date.now();
const auth = createAuthModule();
const assinaturaRepo = new DrizzleAssinaturaRepository(db);
const cobrancaRepo = new DrizzleCobrancaRepository(db);
const planoRepo = new DrizzlePlanoRepository(db);
const vagaRepo = new DrizzleVagaPromocionalRepository(db);

await planoRepo.salvar(
  Plano.criar({
    id: "plano-basico",
    nome: "Básico",
    valorMensal: 99.9,
  }),
);

async function criarClinica(sufixo) {
  const emailAdmin = `admin.ass.${sufixo}.${agora}@dentyvo-demo.test`;
  const clinica = await new CriarClinicaComAdmin(
    auth.clinicaRepo,
    auth.profissionalRepo,
    auth.authPort,
  ).executar({
    clinica: {
      nome: `Clínica Assinatura ${sufixo} ${agora}`,
      endereco: "Rua das Palmeiras, 100 — Centro",
      tipoDocumento: "cnpj",
      documento: gerarCnpjValido(),
    },
    admin: {
      nome: `Admin ${sufixo}`,
      email: emailAdmin,
      senha: SENHA,
    },
  });
  const trial = await new IniciarTrial(assinaturaRepo).executar({
    clinicaId: clinica.id,
  });
  const usuarioAdmin = await auth.authPort.buscarUsuarioPorEmail(emailAdmin);
  if (!usuarioAdmin) throw new Error("Admin não encontrado");
  return { clinica, trial, emailAdmin, usuarioAdmin };
}

async function ativarComPromo(trial, sufixo, migrar) {
  const vaga = await vagaRepo.reservarAtomico({
    clinicaId: trial.clinicaId,
    assinaturaId: trial.id,
    agora: new Date(),
  });
  let assinatura = trial
    .aplicarCopiaPromocionalDaVaga({
      vaga,
      precoPromocionalCentavos: PRECO_PROMOCIONAL_CENTAVOS.basico,
    })
    .ativarAposPagamento({
      planoId: "plano-basico",
      gatewayClienteId: `gw-cli-${sufixo}-${agora}`,
      gatewayAssinaturaId: `gw-sub-${sufixo}-${agora}`,
      dataProximaCobranca: new Date("2026-09-01T12:00:00.000Z"),
    });
  if (migrar) {
    assinatura = assinatura.marcarMigradaParaPrecoCheio(
      new Date("2026-08-02T12:00:00.000Z"),
    );
  }
  await assinaturaRepo.salvar(assinatura);
  return { assinatura, vaga };
}

function cobranca(assinaturaId, i, status, link = null) {
  const dia = String((i % 28) + 1).padStart(2, "0");
  const mes = String(Math.floor(i / 28) + 1).padStart(2, "0");
  return Cobranca.criar({
    id: randomUUID(),
    assinaturaId,
    gatewayCobrancaId: `gw-cob-${assinaturaId}-${i}`,
    valor: 59.9,
    metodo: i % 2 === 0 ? "pix" : "boleto",
    vencimento: new Date(`2026-${mes}-${dia}T12:00:00.000Z`),
    status,
    linkPagamento: link,
  });
}

const trial = await criarClinica("trial");
const emailDentista = `dentista.ass.trial.${agora}@dentyvo-demo.test`;
const convite = await new ConvidarUsuario(
  auth.conviteRepo,
  auth.profissionalRepo,
  auth.clinicaRepo,
  auth.authPort,
  auth.email,
).executar({
  clinicaId: trial.clinica.id,
  email: emailDentista,
  papel: "dentista",
  convidadoPorUsuarioId: trial.usuarioAdmin.id,
});
await new AceitarConvite(
  auth.conviteRepo,
  auth.profissionalRepo,
  auth.authPort,
).executar({
  token: convite.token,
  nome: "Dra. Márcia Dentista",
  senha: SENHA,
  cro: "77889-SP",
  especialidade: "Clínica Geral",
});

const promo = await criarClinica("promo");
await ativarComPromo(promo.trial, "promo", false);

const migrada = await criarClinica("migrada");
await ativarComPromo(migrada.trial, "migrada", true);

const vencida = await criarClinica("vencida");
const vencidaAtiva = await ativarComPromo(vencida.trial, "vencida", false);
const inadimplente = vencidaAtiva.assinatura.marcarInadimplente();
await assinaturaRepo.salvar(inadimplente);
for (let i = 0; i < 13; i++) {
  const status = i === 12 ? "vencida" : "paga";
  await cobrancaRepo.salvar(
    cobranca(
      inadimplente.id,
      i,
      status,
      status === "vencida" ? "https://pagar.exemplo/regularizar" : null,
    ),
  );
}

const obter = new ObterDetalhesAssinatura(
  assinaturaRepo,
  planoRepo,
  cobrancaRepo,
  vagaRepo,
  auth.profissionalRepo,
  new ResolverValorCobrancaAssinatura(assinaturaRepo, planoRepo),
);

async function checar(nome, clinicaId, usuarioId) {
  const d = await obter.executar({
    clinicaId,
    solicitadoPorUsuarioId: usuarioId,
  });
  return {
    cenario: nome,
    status: d.status,
    plano: d.plano,
    valorEfetivoCentavos: d.valorEfetivoCentavos,
    origemValor: d.origemValor,
    precoPromocionalAte: d.precoPromocionalAte,
    migradaParaPrecoCheioEm: d.migradaParaPrecoCheioEm,
    vaga: d.vagaPromocional,
    linkRegularizacao: d.linkRegularizacao,
    historico: d.historicoCobranca.length,
    primeiroVencimento: d.historicoCobranca[0]?.vencimento ?? null,
  };
}

const checagens = {
  trial: await checar("trial", trial.clinica.id, trial.usuarioAdmin.id),
  promo: await checar("promo", promo.clinica.id, promo.usuarioAdmin.id),
  migrada: await checar("migrada", migrada.clinica.id, migrada.usuarioAdmin.id),
  vencida: await checar("vencida", vencida.clinica.id, vencida.usuarioAdmin.id),
};

console.log(
  JSON.stringify(
    {
      senha: SENHA,
      contas: {
        trial: trial.emailAdmin,
        dentistaTrial: emailDentista,
        promo: promo.emailAdmin,
        migrada: migrada.emailAdmin,
        vencida: vencida.emailAdmin,
      },
      checagens,
    },
    null,
    2,
  ),
);
