/**
 * Cria clínica + admin com senha conhecida, agenda demo (2 consultas) e
 * imprime credenciais de login no console.
 *
 * Uso: node --import tsx scripts/seed-agenda-demo.mjs
 */
import { config } from "dotenv";
config({ path: ".env.local", override: true });

const SENHA_DEMO = "SenhaDemo!Agenda123";

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
const { createAuthModule } = await import(
  "../src/core/auth/infra/create-auth-module.ts"
);
const { CriarProcedimento } = await import(
  "../src/core/agendamento/application/use-cases/CriarProcedimento.ts"
);
const { DefinirDisponibilidadeProfissional } = await import(
  "../src/core/agendamento/application/use-cases/DefinirDisponibilidadeProfissional.ts"
);
const { MarcarConsulta } = await import(
  "../src/core/agendamento/application/use-cases/MarcarConsulta.ts"
);
const { instanteNoTimezone, partesDataNoTimezone } = await import(
  "../src/core/agendamento/application/use-cases/helpers.ts"
);
const { TIMEZONE_PADRAO } = await import(
  "../src/core/agendamento/domain/constants.ts"
);
const { createAgendamentoModule } = await import(
  "../src/core/agendamento/infra/create-agendamento-module.ts"
);
const { CriarPaciente } = await import(
  "../src/core/paciente/application/use-cases/CriarPaciente.ts"
);
const { createPacienteModule } = await import(
  "../src/core/paciente/infra/create-paciente-module.ts"
);

const agora = Date.now();
const email = `agenda.demo.${agora}@dentyvo-demo.test`;
const senha = SENHA_DEMO;

const auth = createAuthModule();
const clinica = await new CriarClinicaComAdmin(
  auth.clinicaRepo,
  auth.profissionalRepo,
  auth.authPort,
).executar({
  clinica: {
    nome: `Clínica Demo Agenda ${agora}`,
    endereco: "Rua Demo Agenda, 100 - São Paulo/SP",
    tipoDocumento: "cnpj",
    documento: gerarCnpjValido(),
  },
  admin: {
    nome: "Admin Demo Agenda",
    email,
    senha,
  },
});

const profissional = await auth.profissionalRepo.buscarPorUsuarioId(
  (
    await auth.authPort.buscarUsuarioPorEmail(email)
  ).id,
);
if (!profissional) {
  console.error("Profissional admin não encontrado após criar clínica.");
  process.exit(1);
}

const clinicaId = clinica.id;
const usuarioId = profissional.usuarioId;
const profissionalId = profissional.id;

const mod = createAgendamentoModule();
const pacMod = createPacienteModule();

const paciente = await new CriarPaciente(
  pacMod.pacienteRepo,
  pacMod.profissionalRepo,
).executar({
  clinicaId,
  solicitadoPorUsuarioId: usuarioId,
  nome: "Paciente Demo Agenda",
  cpf: gerarCpfValido(),
  telefone: "11999990000",
  dataNascimento: new Date("1990-01-15T12:00:00.000Z"),
});

const procedimento = await new CriarProcedimento(
  mod.procedimentoRepo,
  mod.profissionalRepo,
).executar({
  clinicaId,
  solicitadoPorUsuarioId: usuarioId,
  nome: "Consulta avaliação",
  duracaoPadraoMinutos: 30,
  valor: 150,
});

await new DefinirDisponibilidadeProfissional(
  mod.disponibilidadeRepo,
  mod.profissionalRepo,
).executar({
  clinicaId,
  solicitadoPorUsuarioId: usuarioId,
  profissionalId,
  janelas: [0, 1, 2, 3, 4, 5, 6].map((diaDaSemana) => ({
    diaDaSemana,
    horaInicio: "07:00",
    horaFim: "20:00",
  })),
});

const hoje = new Date();
const { ano, mes, dia } = partesDataNoTimezone(hoje, TIMEZONE_PADRAO);
const marcar = new MarcarConsulta(
  mod.agendamentoRepo,
  mod.disponibilidadeRepo,
  mod.procedimentoRepo,
  mod.pacienteRepo,
  mod.profissionalRepo,
  mod.lembrete,
);

const a1 = await marcar.executar({
  clinicaId,
  solicitadoPorUsuarioId: usuarioId,
  pacienteId: paciente.id,
  profissionalId,
  procedimentoId: procedimento.id,
  dataHoraInicio: instanteNoTimezone(ano, mes, dia, 10 * 60, TIMEZONE_PADRAO),
  origem: "painel",
});

const a2 = await marcar.executar({
  clinicaId,
  solicitadoPorUsuarioId: usuarioId,
  pacienteId: paciente.id,
  profissionalId,
  procedimentoId: procedimento.id,
  dataHoraInicio: instanteNoTimezone(ano, mes, dia, 11 * 60, TIMEZONE_PADRAO),
  origem: "painel",
});

console.log("");
console.log("========== LOGIN DEMO AGENDA ==========");
console.log(`E-mail: ${email}`);
console.log(`Senha:  ${senha}`);
console.log("=======================================");
console.log("");
console.log("OK", {
  clinicaId,
  profissionalId,
  paciente: paciente.id,
  a1: a1.id,
  a1Inicio: a1.dataHoraInicio.toISOString(),
  a2: a2.id,
  a2Inicio: a2.dataHoraInicio.toISOString(),
});
process.exit(0);
