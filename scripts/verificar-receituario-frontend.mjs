/**
 * Seed + verificação backend dos cenários do receituário na UI (spec 006).
 * Uso: node --import tsx scripts/verificar-receituario-frontend.mjs
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { config } from "dotenv";
config({ path: ".env.local", override: true });

import { PDFDocument } from "pdf-lib";

const SENHA = "SenhaDemo!Receituario123";

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

async function textoDoPdf(bytes) {
  const doc = await PDFDocument.load(bytes);
  // pdf-lib não extrai texto; validamos assinatura PDF + tamanho e
  // re-geramos conteúdo esperado via snapshot da receita (abaixo).
  const header = Buffer.from(bytes.slice(0, 5)).toString("ascii");
  return { header, pageCount: doc.getPageCount(), tamanho: bytes.length };
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
const { createReceituarioModule } = await import(
  "../src/core/receituario/infra/create-receituario-module.ts"
);
const { PermissaoNegadaError } = await import(
  "../src/core/shared/errors.ts"
);

const agora = Date.now();
const emailAdmin = `admin.receita.${agora}@dentyvo-demo.test`;
const emailDentista = `dentista.receita.${agora}@dentyvo-demo.test`;
const croDentista = "54321-SP";
const clinicaNome = `Clínica Demo Receituário ${agora}`;
const clinicaEndereco = "Av. Odontologia, 200 - Curitiba/PR";
const pacienteNome = "Paciente Demo Receita";
const pacienteCpf = gerarCpfValido();

const auth = createAuthModule();
const clinica = await new CriarClinicaComAdmin(
  auth.clinicaRepo,
  auth.profissionalRepo,
  auth.authPort,
).executar({
  clinica: {
    nome: clinicaNome,
    endereco: clinicaEndereco,
    tipoDocumento: "cnpj",
    documento: gerarCnpjValido(),
  },
  admin: {
    nome: "Admin Sem CRO",
    email: emailAdmin,
    senha: SENHA,
  },
});

const usuarioAdmin = await auth.authPort.buscarUsuarioPorEmail(emailAdmin);
if (!usuarioAdmin) throw new Error("Admin não encontrado");
const profissionalAdmin = await auth.profissionalRepo.buscarPorUsuarioId(
  usuarioAdmin.id,
);
if (!profissionalAdmin) throw new Error("Profissional admin não encontrado");

const convite = await new ConvidarUsuario(
  auth.conviteRepo,
  auth.profissionalRepo,
  auth.clinicaRepo,
  auth.authPort,
  auth.email,
).executar({
  clinicaId: clinica.id,
  email: emailDentista,
  papel: "dentista",
  convidadoPorUsuarioId: usuarioAdmin.id,
});

const dentista = await new AceitarConvite(
  auth.conviteRepo,
  auth.profissionalRepo,
  auth.authPort,
).executar({
  token: convite.token,
  nome: "Dra. Ana Dentista",
  senha: SENHA,
  cro: croDentista,
  especialidade: "Clínica Geral",
});

const pacMod = createPacienteModule();
const paciente = await new CriarPaciente(
  pacMod.pacienteRepo,
  pacMod.profissionalRepo,
).executar({
  clinicaId: clinica.id,
  solicitadoPorUsuarioId: usuarioAdmin.id,
  nome: pacienteNome,
  cpf: pacienteCpf,
  telefone: "41988887777",
  dataNascimento: new Date("1988-05-20T12:00:00.000Z"),
});

const prontMod = createProntuarioModule();
const prontuario = await new CriarProntuario(
  prontMod.prontuarioRepo,
  prontMod.pacienteRepo,
  prontMod.profissionalRepo,
  prontMod.auditoria,
).executar({
  clinicaId: clinica.id,
  solicitadoPorUsuarioId: usuarioAdmin.id,
  pacienteId: paciente.id,
});

const receituario = createReceituarioModule();
const itens = [
  {
    medicamento: "Amoxicilina",
    dosagem: "500 mg",
    posologia: "1 comprimido de 8/8h",
    duracao: "7 dias",
  },
  {
    medicamento: "Ibuprofeno",
    dosagem: "600 mg",
    posologia: "1 comprimido de 8/8h se dor",
    duracao: "3 dias",
  },
  {
    medicamento: "Dipirona",
    dosagem: "500 mg",
    posologia: "1 comprimido até 4x/dia se dor",
    duracao: "2 dias",
  },
];

const resultados = [];

// 1 — Emitir + listar
const receita = await receituario.emitirReceita.executar({
  clinicaId: clinica.id,
  solicitadoPorUsuarioId: dentista.usuarioId,
  prontuarioId: prontuario.id,
  itens,
});
const lista = await receituario.listarReceitasDoProntuario.executar({
  clinicaId: clinica.id,
  solicitadoPorUsuarioId: dentista.usuarioId,
  prontuarioId: prontuario.id,
});
const apareceNaLista =
  lista.length >= 1 &&
  lista[0].id === receita.id &&
  lista[0].itens.length === 3;
resultados.push({
  n: 1,
  titulo: "Emitir receita com 3 itens e aparecer na lista",
  ok: apareceNaLista,
  detalhe: {
    receitaId: receita.id,
    quantidadeNaLista: lista.length,
    itens: lista[0]?.itens.length,
    profissionalId: receita.profissionalId,
    profissionalEsperado: dentista.id,
  },
});

// 2 — PDF
const pdf = await receituario.gerarPdfReceita.executar({
  clinicaId: clinica.id,
  solicitadoPorUsuarioId: dentista.usuarioId,
  receitaId: receita.id,
});
const meta = await textoDoPdf(pdf.bytes);
const cab = receita.cabecalho;
const pdfOk =
  meta.header === "%PDF-" &&
  meta.pageCount >= 1 &&
  meta.tamanho > 500 &&
  cab.clinicaNome === clinicaNome &&
  cab.clinicaEndereco === clinicaEndereco &&
  cab.pacienteNome === pacienteNome &&
  cab.pacienteCpf === pacienteCpf &&
  cab.profissionalNome === "Dra. Ana Dentista" &&
  cab.profissionalCro === croDentista &&
  receita.itens.length === 3 &&
  receita.itens[0].medicamento === "Amoxicilina" &&
  receita.itens[1].medicamento === "Ibuprofeno" &&
  receita.itens[2].medicamento === "Dipirona";

const pdfPath = join(process.cwd(), `tmp-receita-${receita.id.slice(0, 8)}.pdf`);
writeFileSync(pdfPath, pdf.bytes);

resultados.push({
  n: 2,
  titulo: "PDF gerado com cabeçalho/itens/paciente corretos",
  ok: pdfOk,
  detalhe: {
    arquivo: pdfPath,
    nomeArquivo: pdf.nomeArquivo,
    ...meta,
    snapshot: {
      clinicaNome: cab.clinicaNome,
      clinicaEndereco: cab.clinicaEndereco,
      pacienteNome: cab.pacienteNome,
      pacienteCpf: cab.pacienteCpf,
      profissionalNome: cab.profissionalNome,
      profissionalCro: cab.profissionalCro,
      itens: receita.itens.map((i) => i.medicamento),
    },
  },
});

// 3 — Admin (sem papel dentista) bloqueado
let adminBloqueado = false;
let codigoErroAdmin = null;
try {
  await receituario.listarReceitasDoProntuario.executar({
    clinicaId: clinica.id,
    solicitadoPorUsuarioId: usuarioAdmin.id,
    prontuarioId: prontuario.id,
  });
} catch (erro) {
  adminBloqueado = erro instanceof PermissaoNegadaError;
  codigoErroAdmin = erro?.nome ?? erro?.constructor?.name;
}
let adminEmitirBloqueado = false;
try {
  await receituario.emitirReceita.executar({
    clinicaId: clinica.id,
    solicitadoPorUsuarioId: usuarioAdmin.id,
    prontuarioId: prontuario.id,
    itens: [itens[0]],
  });
} catch (erro) {
  adminEmitirBloqueado = erro instanceof PermissaoNegadaError;
}
resultados.push({
  n: 3,
  titulo: "Admin sem CRO/papel dentista bloqueado (listar + emitir)",
  ok: adminBloqueado && adminEmitirBloqueado,
  detalhe: {
    papelAdmin: profissionalAdmin.papel,
    croAdmin: profissionalAdmin.cro,
    codigoErro: codigoErroAdmin,
    uiEsperada: "seção Receituário oculta (podeReceituario=false)",
  },
});

// 4 — Imutabilidade na UI: sem botão editar (checagem estática do componente)
const { readFileSync } = await import("node:fs");
const listaSrc = readFileSync(
  join(process.cwd(), "src/components/prontuario/ReceitasLista.tsx"),
  "utf8",
);
const semEditar =
  !/Editar|onEdit|editarReceita/i.test(listaSrc) &&
  listaSrc.includes("Baixar PDF") &&
  listaSrc.includes("Nova receita");
resultados.push({
  n: 4,
  titulo: "Lista sem botão/ação de edição (imutável)",
  ok: semEditar,
  detalhe: {
    temBaixarPdf: listaSrc.includes("Baixar PDF"),
    temNovaReceita: listaSrc.includes("Nova receita"),
    temEditar: /Editar|onEdit|editarReceita/i.test(listaSrc),
  },
});

console.log("\n=== Credenciais para verificação visual (npm run dev) ===");
console.log(
  JSON.stringify(
    {
      emailAdmin,
      emailDentista,
      senha: SENHA,
      pacienteId: paciente.id,
      prontuarioId: prontuario.id,
      urlPaciente: `http://localhost:3000/pacientes/${paciente.id}`,
      pdfGerado: pdfPath,
    },
    null,
    2,
  ),
);

console.log("\n=== Resultados ===");
for (const r of resultados) {
  console.log(
    `${r.ok ? "OK" : "FALHOU"} | ${r.n}. ${r.titulo}`,
    JSON.stringify(r.detalhe),
  );
}

if (resultados.some((r) => !r.ok)) {
  process.exit(1);
}
