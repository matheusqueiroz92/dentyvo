/**
 * Seed mínimo para validação visual da agenda.
 * Uso: node --import tsx scripts/seed-agenda-demo.mjs
 */
import { config } from "dotenv";
config({ path: ".env.local", override: true });

const { sql } = await import("drizzle-orm");
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
const { db } = await import("../src/db/index.ts");

const mod = createAgendamentoModule();
const pacMod = createPacienteModule();

const result = await db.execute(
  sql`select id, clinica_id, usuario_id, nome, papel from profissional limit 1`,
);
const rows = /** @type {Array<Record<string, string>>} */ (
  result.rows ?? result
);
const prof = rows[0];
if (!prof) {
  console.error("Nenhum profissional no banco.");
  process.exit(1);
}

const clinicaId = prof.clinica_id;
const usuarioId = prof.usuario_id;
const profissionalId = prof.id;
console.log("Seed para", { clinicaId, profissionalId, papel: prof.papel });

const paciente = await new CriarPaciente(
  pacMod.pacienteRepo,
  pacMod.profissionalRepo,
).executar({
  clinicaId,
  solicitadoPorUsuarioId: usuarioId,
  nome: "Paciente Demo Agenda",
  cpf: "52998224725",
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

console.log("OK", { paciente: paciente.id, a1: a1.id, a2: a2.id });
process.exit(0);
