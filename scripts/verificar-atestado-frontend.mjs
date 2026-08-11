/**
 * Seed + verificação backend/UI estática do atestado (spec 006b).
 * Uso: node --import tsx scripts/verificar-atestado-frontend.mjs
 */
import { inflateSync } from "node:zlib";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { config } from "dotenv";
config({ path: ".env.local", override: true });

import { PDFDocument } from "pdf-lib";

/** pdf-lib grava texto em hex comprimido (FlateDecode); latin1 bruto não contém o conteúdo. */
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
      /* objeto de metadados / xref compactado — ignorar */
    }
  }
  return partes.join("\n");
}

const SENHA = "SenhaDemo!Atestado123";

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
const { createAtestadoModule } = await import(
  "../src/core/atestado/infra/create-atestado-module.ts"
);
const { PermissaoNegadaError } = await import("../src/core/shared/errors.ts");
const { CidFormatoInvalidoError } = await import(
  "../src/core/atestado/domain/errors.ts"
);
const { formatarPeriodoAfastamento } = await import(
  "../src/lib/atestado/periodo.ts"
);

const agora = Date.now();
const emailAdmin = `admin.atestado.${agora}@dentyvo-demo.test`;
const emailDentista = `dentista.atestado.${agora}@dentyvo-demo.test`;
const croDentista = "54321-SP";
const clinicaNome = `Clinica Demo Atestado ${agora}`;
const clinicaEndereco = "Av. Odontologia, 200 - Curitiba/PR";
const pacienteNome = "Paciente Demo Atestado";
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
  especialidade: "Clinica Geral",
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

const atestadoMod = createAtestadoModule();
const dataInicio = new Date("2026-08-05T00:00:00.000Z");
const resultados = [];

const atestado = await atestadoMod.emitirAtestado.executar({
  clinicaId: clinica.id,
  solicitadoPorUsuarioId: dentista.usuarioId,
  prontuarioId: prontuario.id,
  motivo: "repouso pos-procedimento",
  cid: "K08.1",
  dataInicio,
  quantidadeDias: 5,
});
const lista = await atestadoMod.listarAtestadosDoProntuario.executar({
  clinicaId: clinica.id,
  solicitadoPorUsuarioId: dentista.usuarioId,
  prontuarioId: prontuario.id,
});
const periodoRotulo = formatarPeriodoAfastamento(
  atestado.dataInicio,
  atestado.dataFim,
  atestado.quantidadeDias,
);
resultados.push({
  n: 1,
  titulo: "Emitir com CID válido e período inclusivo na lista",
  ok:
    lista[0]?.id === atestado.id &&
    atestado.cid === "K08.1" &&
    atestado.dataFim.toISOString().slice(0, 10) === "2026-08-09" &&
    periodoRotulo === "05/08 a 09/08 — 5 dias",
  detalhe: {
    atestadoId: atestado.id,
    cid: atestado.cid,
    dataFim: atestado.dataFim.toISOString(),
    periodoRotulo,
  },
});

let cidInvalidoOk = false;
try {
  await atestadoMod.emitirAtestado.executar({
    clinicaId: clinica.id,
    solicitadoPorUsuarioId: dentista.usuarioId,
    prontuarioId: prontuario.id,
    motivo: "repouso",
    cid: "08",
    dataInicio,
    quantidadeDias: 1,
  });
} catch (erro) {
  cidInvalidoOk = erro instanceof CidFormatoInvalidoError;
}
resultados.push({
  n: 2,
  titulo: "CID inválido rejeitado no domínio (form Zod espelha o formato)",
  ok: cidInvalidoOk,
});

const pdf = await atestadoMod.gerarPdfAtestado.executar({
  clinicaId: clinica.id,
  solicitadoPorUsuarioId: dentista.usuarioId,
  atestadoId: atestado.id,
});
const doc = await PDFDocument.load(pdf.bytes);
const textoPdf = extrairTextoPdf(pdf.bytes);
const header = Buffer.from(pdf.bytes.slice(0, 5)).toString("ascii");
const pdfPath = join(
  process.cwd(),
  `tmp-atestado-${atestado.id.slice(0, 8)}.pdf`,
);
writeFileSync(pdfPath, pdf.bytes);
const pdfOk =
  header === "%PDF-" &&
  doc.getPageCount() >= 1 &&
  textoPdf.includes("K08.1") &&
  textoPdf.includes("repouso pos-procedimento") &&
  textoPdf.includes("05/08/2026") &&
  textoPdf.includes("09/08/2026");
resultados.push({
  n: 3,
  titulo: "PDF contém motivo, CID e período",
  ok: pdfOk,
  detalhe: {
    arquivo: pdfPath,
    header,
    pages: doc.getPageCount(),
    trecho: textoPdf.slice(0, 800),
  },
});

let adminBloqueado = false;
try {
  await atestadoMod.listarAtestadosDoProntuario.executar({
    clinicaId: clinica.id,
    solicitadoPorUsuarioId: usuarioAdmin.id,
    prontuarioId: prontuario.id,
  });
} catch (erro) {
  adminBloqueado = erro instanceof PermissaoNegadaError;
}
const listaSrc = readFileSync(
  join(process.cwd(), "src/components/prontuario/ProntuarioTab.tsx"),
  "utf8",
);
const detalheSrc = readFileSync(
  join(process.cwd(), "src/components/pacientes/PacienteDetalheClient.tsx"),
  "utf8",
);
const uiAdminOculta =
  detalheSrc.includes('papel === "dentista"') &&
  listaSrc.includes("AtestadosLista") &&
  listaSrc.includes("podeReceituario");
resultados.push({
  n: 4,
  titulo: "Admin bloqueado no use case; UI só dentista vê a seção",
  ok: adminBloqueado && uiAdminOculta,
  detalhe: { adminBloqueado, uiAdminOculta },
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
  console.log(`${r.ok ? "OK" : "FALHOU"} | ${r.n}. ${r.titulo}`);
}

if (resultados.some((r) => !r.ok)) process.exit(1);
