/**
 * Seed + verificação backend do orçamento (spec 015) para demo no browser.
 * Uso: node --import tsx scripts/verificar-orcamento-frontend.mjs
 */
import { inflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { config } from "dotenv";
config({ path: ".env.local", override: true });

function extrairTextoPdf(bytes) {
  const raw = Buffer.from(bytes).toString("binary");
  const streams = [...raw.matchAll(/stream\r?\n([\s\S]*?)\nendstream/g)];
  const partes = [];
  for (const match of streams) {
    try {
      const inflado = inflateSync(Buffer.from(match[1], "binary")).toString(
        "latin1",
      );
      for (const hex of inflado.matchAll(/<([0-9A-Fa-f]+)> Tj/g)) {
        partes.push(Buffer.from(hex[1], "hex").toString("utf8"));
      }
      for (const lit of inflado.matchAll(/\(([^)]{2,200})\) Tj/g)) {
        partes.push(lit[1]);
      }
    } catch {
      /* ignore */
    }
  }
  return partes.join("\n");
}

const SENHA = "SenhaDemo!Orcamento123";

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

function gerarCpfValido() {
  const n = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  const digito = (base, fator) => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) soma += base[i] * (fator - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  const d1 = digito(n, 10);
  const d2 = digito([...n, d1], 11);
  return [...n, d1, d2].join("");
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
const { CriarPaciente } = await import(
  "../src/core/paciente/application/use-cases/CriarPaciente.ts"
);
const { createPacienteModule } = await import(
  "../src/core/paciente/infra/create-paciente-module.ts"
);
const { CriarProntuario } = await import(
  "../src/core/prontuario/application/use-cases/CriarProntuario.ts"
);
const { createProntuarioModule } = await import(
  "../src/core/prontuario/infra/create-prontuario-module.ts"
);
const { CriarProcedimento } = await import(
  "../src/core/agendamento/application/use-cases/CriarProcedimento.ts"
);
const { createAgendamentoModule } = await import(
  "../src/core/agendamento/infra/create-agendamento-module.ts"
);
const { createOrcamentoModule } = await import(
  "../src/core/orcamento/infra/create-orcamento-module.ts"
);

const agora = Date.now();
const emailAdmin = `admin.orcamento.${agora}@dentyvo-demo.test`;
const emailDentista = `dentista.orcamento.${agora}@dentyvo-demo.test`;
const emailRecepcao = `recepcao.orcamento.${agora}@dentyvo-demo.test`;
const croDentista = "77889-SP";
const clinicaNome = `Clínica Demo Orçamento ${agora}`;
const pacienteNome = "José Antônio Orçamento";
const pacienteCpf = gerarCpfValido();

const auth = createAuthModule();
const clinica = await new CriarClinicaComAdmin(
  auth.clinicaRepo,
  auth.profissionalRepo,
  auth.authPort,
).executar({
  clinica: {
    nome: clinicaNome,
    endereco: "Rua São Paulo, 100 — Centro",
    tipoDocumento: "cnpj",
    documento: gerarCnpjValido(),
  },
  admin: {
    nome: "Admin Orçamento",
    email: emailAdmin,
    senha: SENHA,
  },
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

const dentista = await convidarEAceitar(
  emailDentista,
  "dentista",
  "Dra. Márcia Dentista",
  croDentista,
);
const recepcao = await convidarEAceitar(
  emailRecepcao,
  "recepcao",
  "Recepção Orçamento",
  "99999",
);

const pacienteMod = createPacienteModule();
const paciente = await new CriarPaciente(
  pacienteMod.pacienteRepo,
  pacienteMod.profissionalRepo,
).executar({
  clinicaId: clinica.id,
  solicitadoPorUsuarioId: usuarioAdmin.id,
  nome: pacienteNome,
  cpf: pacienteCpf,
  telefone: "11999990000",
  dataNascimento: new Date("1990-05-15T00:00:00.000Z"),
});

const prontuarioMod = createProntuarioModule();
const prontuario = await new CriarProntuario(
  prontuarioMod.prontuarioRepo,
  prontuarioMod.pacienteRepo,
  prontuarioMod.profissionalRepo,
  prontuarioMod.auditoria,
).executar({
  clinicaId: clinica.id,
  solicitadoPorUsuarioId: dentista.usuarioId,
  pacienteId: paciente.id,
});

const agendamentoMod = createAgendamentoModule();
const criarProc = new CriarProcedimento(
  agendamentoMod.procedimentoRepo,
  agendamentoMod.profissionalRepo,
);
const procLimpeza = await criarProc.executar({
  clinicaId: clinica.id,
  solicitadoPorUsuarioId: dentista.usuarioId,
  nome: "Limpeza",
  duracaoPadraoMinutos: 30,
  valor: 150,
});
const procClareamento = await criarProc.executar({
  clinicaId: clinica.id,
  solicitadoPorUsuarioId: dentista.usuarioId,
  nome: "Clareamento dentário",
  duracaoPadraoMinutos: 60,
  valor: 800,
});
const procRestauracao = await criarProc.executar({
  clinicaId: clinica.id,
  solicitadoPorUsuarioId: dentista.usuarioId,
  nome: "Restauração em resina",
  duracaoPadraoMinutos: 45,
  valor: 280,
});

const orcamentoMod = createOrcamentoModule();

const emitido = await orcamentoMod.emitirOrcamento.executar({
  clinicaId: clinica.id,
  solicitadoPorUsuarioId: dentista.usuarioId,
  prontuarioId: prontuario.id,
  itens: [
    { procedimentoId: procLimpeza.id, valor: 150, quantidade: 1 },
    { procedimentoId: procClareamento.id, valor: 750, quantidade: 1 },
    { procedimentoId: procRestauracao.id, valor: 280, quantidade: 2 },
  ],
  validoAte: new Date("2026-12-31T00:00:00.000Z"),
});

const totalEsperado = 150 + 750 + 280 * 2;
if (emitido.total !== totalEsperado) {
  throw new Error(`Total incorreto: ${emitido.total} !== ${totalEsperado}`);
}
if (emitido.itens[1].valor !== 750) {
  throw new Error("Snapshot de valor ajustado não persistiu");
}
console.log(`OK 1 backend: emitido total=${emitido.total} status=${emitido.status}`);

const aceito = await orcamentoMod.aceitarOrcamento.executar({
  clinicaId: clinica.id,
  solicitadoPorUsuarioId: dentista.usuarioId,
  orcamentoId: emitido.id,
});
if (aceito.status !== "aceito") throw new Error("Aceite falhou");
console.log("OK 2 backend: aceito");

const emitidoRecepcao = await orcamentoMod.emitirOrcamento.executar({
  clinicaId: clinica.id,
  solicitadoPorUsuarioId: recepcao.usuarioId,
  prontuarioId: prontuario.id,
  itens: [{ procedimentoId: procLimpeza.id, valor: 160, quantidade: 1 }],
});
const decididoRecepcao = await orcamentoMod.recusarOrcamento.executar({
  clinicaId: clinica.id,
  solicitadoPorUsuarioId: recepcao.usuarioId,
  orcamentoId: emitidoRecepcao.id,
});
if (decididoRecepcao.status !== "recusado") {
  throw new Error("Recepção não conseguiu decidir");
}
console.log("OK 4 backend: recepção emitiu e recusou");

const pdf = await orcamentoMod.gerarPdfOrcamento.executar({
  clinicaId: clinica.id,
  solicitadoPorUsuarioId: dentista.usuarioId,
  orcamentoId: emitido.id,
});
const out = join(process.cwd(), "tmp-orcamento-frontend.pdf");
writeFileSync(out, Buffer.from(pdf.bytes));
const texto = extrairTextoPdf(pdf.bytes);
const checks = ["ORÇAMENTO", "Limpeza", "Clareamento", "Válido até", "Aceito"];
for (const c of checks) {
  if (!texto.includes(c) && !texto.toLowerCase().includes(c.toLowerCase())) {
    console.warn(`AVISO PDF: trecho "${c}" não encontrado na extração bruta`);
  }
}
console.log(`OK 5 PDF gravado em ${out}`);

console.log("\n=== Credenciais para verificação UI ===");
console.log(`Dentista: ${emailDentista} / ${SENHA}`);
console.log(`Recepção: ${emailRecepcao} / ${SENHA}`);
console.log(`Paciente: ${pacienteNome} (id=${paciente.id})`);
console.log(`Prontuário: ${prontuario.id}`);
console.log(`Orçamento aceito: ${emitido.id}`);
console.log(`URL paciente: /pacientes/${paciente.id}`);
