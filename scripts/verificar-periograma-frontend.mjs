/**
 * Seed + verificação dos critérios do periograma (UI / feature 005).
 * Uso: node --import tsx scripts/verificar-periograma-frontend.mjs
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { config } from "dotenv";
config({ path: ".env.local", override: true });

const SENHA = "SenhaDemo!Periograma123";

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
const { createPeriogramaModule } = await import(
  "../src/core/periograma/infra/create-periograma-module.ts"
);
const { FurcaNaoAplicavelAoDenteError } = await import(
  "../src/core/periograma/domain/errors.ts"
);
const { ehDenteMultirradicular } = await import(
  "../src/core/periograma/domain/DentePeriograma.ts"
);
const { classificacaoFurcaSchema } = await import(
  "../src/lib/periograma/schema.ts"
);

const agora = Date.now();
const emailAdmin = `admin.periograma.${agora}@dentyvo-demo.test`;
const emailDentista = `dentista.periograma.${agora}@dentyvo-demo.test`;
const resultados = [];

const auth = createAuthModule();
const clinica = await new CriarClinicaComAdmin(
  auth.clinicaRepo,
  auth.profissionalRepo,
  auth.authPort,
).executar({
  clinica: {
    nome: `Clinica Demo Periograma ${agora}`,
    endereco: "Rua Periodontal, 50 - SP",
    tipoDocumento: "cnpj",
    documento: gerarCnpjValido(),
  },
  admin: {
    nome: "Admin Periograma",
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
  nome: "Dr. Peri Demo",
  senha: SENHA,
  cro: "99887-SP",
  especialidade: "Periodontia",
});

const pacMod = createPacienteModule();
const paciente = await new CriarPaciente(
  pacMod.pacienteRepo,
  pacMod.profissionalRepo,
).executar({
  clinicaId: clinica.id,
  solicitadoPorUsuarioId: usuarioAdmin.id,
  nome: "Paciente Demo Periograma",
  cpf: gerarCpfValido(),
  telefone: "11999998888",
  dataNascimento: new Date("1990-03-15T12:00:00.000Z"),
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

const peri = createPeriogramaModule();

// 1) Exame inicial com 2–3 dentes e pontos parciais
const exameInicial = await peri.registrarPeriograma.executar({
  clinicaId: clinica.id,
  solicitadoPorUsuarioId: dentista.usuarioId,
  prontuarioId: prontuario.id,
  tipo: "exame_inicial",
  dentes: [
    {
      numeroDente: 16,
      mobilidade: 1,
      pontos: [
        {
          lado: "vestibular",
          posicao: "mesial",
          margemGengival: -1,
          profundidadeSondagem: 4,
        },
        {
          lado: "vestibular",
          posicao: "central",
          profundidadeSondagem: 3,
          sangramentoSondagem: true,
        },
      ],
    },
    {
      numeroDente: 11,
      pontos: [
        {
          lado: "palatina_lingual",
          posicao: "distal",
          placa: true,
          profundidadeSondagem: 2,
        },
      ],
    },
    {
      numeroDente: 26,
      implante: true,
      classificacaoFurca: { sistema: "hamp", grau: 2 },
      pontos: [
        {
          lado: "vestibular",
          posicao: "mesial",
          profundidadeSondagem: 5,
        },
      ],
    },
  ],
});

const lista1 = await peri.listarPeriogramasDoProntuario.executar({
  clinicaId: clinica.id,
  solicitadoPorUsuarioId: dentista.usuarioId,
  prontuarioId: prontuario.id,
});

resultados.push({
  n: 1,
  titulo:
    "Salvar exame com 3 dentes (pontos parciais) aparece como exame_inicial no histórico",
  ok:
    exameInicial.tipo === "exame_inicial" &&
    exameInicial.dentes.length === 3 &&
    lista1.length === 1 &&
    lista1[0].id === exameInicial.id &&
    lista1[0].tipo === "exame_inicial",
  detalhe: {
    periogramaId: exameInicial.id,
    tipo: exameInicial.tipo,
    dentes: exameInicial.dentes.map((d) => d.numeroDenteValor),
    pontosPorDente: exameInicial.dentes.map((d) => ({
      n: d.numeroDenteValor,
      pts: d.pontos.length,
    })),
  },
});

// 2) Furca só em molar — UI oculta via ehDenteMultirradicular; domínio rejeita
let furcaIncisivoRejeitada = false;
try {
  await peri.registrarPeriograma.executar({
    clinicaId: clinica.id,
    solicitadoPorUsuarioId: dentista.usuarioId,
    prontuarioId: prontuario.id,
    tipo: "reavaliacao",
    dentes: [
      {
        numeroDente: 11,
        classificacaoFurca: { sistema: "hamp", grau: 1 },
      },
    ],
  });
} catch (erro) {
  furcaIncisivoRejeitada = erro instanceof FurcaNaoAplicavelAoDenteError;
}

const seletorSrc = readFileSync(
  join(process.cwd(), "src/components/periograma/ClassificacaoFurcaSelector.tsx"),
  "utf8",
);
const seletorOcultaNaoMolar =
  seletorSrc.includes("ehDenteMultirradicular") &&
  seletorSrc.includes("if (!aplicavel)") &&
  seletorSrc.includes("return null");

resultados.push({
  n: 2,
  titulo:
    "Furca em não-molar: seletor oculto na UI + domínio rejeita (FurcaNaoAplicavelAoDenteError)",
  ok:
    !ehDenteMultirradicular(11) &&
    ehDenteMultirradicular(16) &&
    furcaIncisivoRejeitada &&
    seletorOcultaNaoMolar,
  detalhe: {
    furcaIncisivoRejeitada,
    seletorOcultaNaoMolar,
    molar16: ehDenteMultirradicular(16),
    incisivo11: ehDenteMultirradicular(11),
  },
});

// 3) Hamp grau 4 barrado no schema Zod (antes do envio)
const hamp4 = classificacaoFurcaSchema.safeParse({
  sistema: "hamp",
  grau: 4,
});
const hamp2 = classificacaoFurcaSchema.safeParse({
  sistema: "hamp",
  grau: 2,
});
const seletorSoGrausValidos =
  seletorSrc.includes("GRAUS_HAMP = [1, 2, 3]") &&
  seletorSrc.includes("GRAUS_GLICKMAN = [1, 2, 3, 4]");

resultados.push({
  n: 3,
  titulo:
    "Hamp grau inválido (4) barrado no formulário (Zod + seletor só 1–3)",
  ok: !hamp4.success && hamp2.success && seletorSoGrausValidos,
  detalhe: {
    hamp4Ok: hamp4.success,
    hamp2Ok: hamp2.success,
    seletorSoGrausValidos,
  },
});

// 4) Segundo exame = reavaliação; inicial permanece intacto
const reavaliacao = await peri.registrarPeriograma.executar({
  clinicaId: clinica.id,
  solicitadoPorUsuarioId: dentista.usuarioId,
  prontuarioId: prontuario.id,
  tipo: "reavaliacao",
  dentes: [
    {
      numeroDente: 16,
      mobilidade: 2,
      pontos: [
        {
          lado: "vestibular",
          posicao: "mesial",
          profundidadeSondagem: 3,
        },
      ],
    },
  ],
});

const lista2 = await peri.listarPeriogramasDoProntuario.executar({
  clinicaId: clinica.id,
  solicitadoPorUsuarioId: dentista.usuarioId,
  prontuarioId: prontuario.id,
});

const inicialConsultado = await peri.consultarPeriograma.executar({
  clinicaId: clinica.id,
  solicitadoPorUsuarioId: dentista.usuarioId,
  periogramaId: exameInicial.id,
});

resultados.push({
  n: 4,
  titulo:
    "Segundo exame como reavaliacao; exame_inicial anterior intacto e consultável",
  ok:
    reavaliacao.tipo === "reavaliacao" &&
    lista2.length === 2 &&
    lista2[0].id === reavaliacao.id &&
    lista2[0].tipo === "reavaliacao" &&
    lista2[1].id === exameInicial.id &&
    lista2[1].tipo === "exame_inicial" &&
    inicialConsultado.dentes.length === 3 &&
    inicialConsultado.tipo === "exame_inicial",
  detalhe: {
    lista: lista2.map((p) => ({ id: p.id, tipo: p.tipo })),
    inicialDentes: inicialConsultado.dentes.length,
  },
});

// 5) UI de histórico / painel só leitura
const chartSrc = readFileSync(
  join(process.cwd(), "src/components/periograma/PeriogramaChart.tsx"),
  "utf8",
);
const panelSrc = readFileSync(
  join(process.cwd(), "src/components/periograma/DentePeriogramaPanel.tsx"),
  "utf8",
);
const histSrc = readFileSync(
  join(process.cwd(), "src/components/periograma/PeriogramaHistorico.tsx"),
  "utf8",
);
const tabSrc = readFileSync(
  join(process.cwd(), "src/components/prontuario/ProntuarioTab.tsx"),
  "utf8",
);

const uiSomenteLeitura =
  chartSrc.includes('somenteLeitura={emLeitura}') &&
  panelSrc.includes("somenteLeitura") &&
  panelSrc.includes("somente leitura") &&
  histSrc.includes("somente leitura") &&
  tabSrc.includes("PeriogramaChart");

resultados.push({
  n: 5,
  titulo:
    "Abrir exame do histórico abre grade/painel em modo somente leitura (sem edição)",
  ok: uiSomenteLeitura,
  detalhe: { uiSomenteLeitura },
});

console.log("\n=== Credenciais para verificação visual (npm run dev) ===");
console.log(
  JSON.stringify(
    {
      emailDentista,
      senha: SENHA,
      pacienteId: paciente.id,
      prontuarioId: prontuario.id,
      urlPaciente: `http://localhost:3000/pacientes/${paciente.id}`,
      exameInicialId: exameInicial.id,
      reavaliacaoId: reavaliacao.id,
    },
    null,
    2,
  ),
);

console.log("\n=== Resultados ===");
let falhas = 0;
for (const r of resultados) {
  const marca = r.ok ? "OK" : "FALHOU";
  if (!r.ok) falhas += 1;
  console.log(`[${marca}] ${r.n}. ${r.titulo}`);
  if (r.detalhe) console.log("   ", JSON.stringify(r.detalhe));
}

if (falhas > 0) {
  process.exitCode = 1;
}
