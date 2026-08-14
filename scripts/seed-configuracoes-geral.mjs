/**
 * Seed temporário para verificação visual da aba Geral.
 * Uso: node --import tsx scripts/seed-configuracoes-geral.mjs
 */
import { config } from "dotenv";
config({ path: ".env.local", override: true });

const SENHA = "SenhaDemo!Geral123";

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
const { DrizzleAssinaturaRepository } = await import(
  "../src/core/assinatura/infra/adapters/DrizzleAssinaturaRepository.ts"
);
const { db } = await import("../src/db/index.ts");

const agora = Date.now();
const emailAdmin = `admin.geral.${agora}@dentyvo-demo.test`;
const emailDentista = `dentista.geral.${agora}@dentyvo-demo.test`;
const emailRecepcao = `recepcao.geral.${agora}@dentyvo-demo.test`;

const auth = createAuthModule();
const clinica = await new CriarClinicaComAdmin(
  auth.clinicaRepo,
  auth.profissionalRepo,
  auth.authPort,
).executar({
  clinica: {
    nome: `Clínica Demo Geral ${agora}`,
    endereco: "Rua das Palmeiras, 100 — Centro",
    tipoDocumento: "cnpj",
    documento: gerarCnpjValido(),
  },
  admin: {
    nome: "Admin Geral",
    email: emailAdmin,
    senha: SENHA,
  },
});

await new IniciarTrial(new DrizzleAssinaturaRepository(db)).executar({
  clinicaId: clinica.id,
});

const usuarioAdmin = await auth.authPort.buscarUsuarioPorEmail(emailAdmin);
if (!usuarioAdmin) throw new Error("Admin não encontrado");

async function convidarEAceitar(email, papel, nome, cro = null) {
  const convite = await new ConvidarUsuario(
    auth.conviteRepo,
    auth.profissionalRepo,
    auth.clinicaRepo,
    auth.authPort,
    auth.email,
  ).executar({
    clinicaId: clinica.id,
    email,
    papel,
    convidadoPorUsuarioId: usuarioAdmin.id,
  });
  return new AceitarConvite(
    auth.conviteRepo,
    auth.profissionalRepo,
    auth.authPort,
  ).executar({
    token: convite.token,
    nome,
    senha: SENHA,
    cro,
    especialidade: papel === "dentista" ? "Clínica Geral" : null,
  });
}

await convidarEAceitar(
  emailDentista,
  "dentista",
  "Dra. Márcia Dentista",
  "77889-SP",
);
await convidarEAceitar(emailRecepcao, "recepcao", "Recepção Geral", null);

console.log(JSON.stringify({
  senha: SENHA,
  clinica: { id: clinica.id, nome: clinica.nome, endereco: clinica.endereco },
  admin: emailAdmin,
  dentista: emailDentista,
  recepcao: emailRecepcao,
}, null, 2));
