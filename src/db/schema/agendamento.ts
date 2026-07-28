import {
  doublePrecision,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { clinica } from "./clinica";
import { paciente } from "./paciente";
import { profissional } from "./profissional";

export const procedimento = pgTable("procedimento", {
  id: text("id").primaryKey(),
  clinicaId: text("clinica_id")
    .notNull()
    .references(() => clinica.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  duracaoPadraoMinutos: integer("duracao_padrao_minutos").notNull(),
  valor: doublePrecision("valor").notNull(),
});

export const disponibilidadeProfissional = pgTable(
  "disponibilidade_profissional",
  {
    id: text("id").primaryKey(),
    clinicaId: text("clinica_id")
      .notNull()
      .references(() => clinica.id, { onDelete: "cascade" }),
    profissionalId: text("profissional_id")
      .notNull()
      .references(() => profissional.id, { onDelete: "cascade" }),
    diaDaSemana: integer("dia_da_semana").notNull(),
    horaInicio: text("hora_inicio").notNull(),
    horaFim: text("hora_fim").notNull(),
  },
);

/**
 * Agendamento. A constraint EXCLUDE GiST (profissional + range half-open) é
 * criada na migration SQL — Drizzle não modela EXCLUDE nativamente.
 */
export const agendamento = pgTable("agendamento", {
  id: text("id").primaryKey(),
  clinicaId: text("clinica_id")
    .notNull()
    .references(() => clinica.id, { onDelete: "cascade" }),
  pacienteId: text("paciente_id")
    .notNull()
    .references(() => paciente.id, { onDelete: "restrict" }),
  profissionalId: text("profissional_id")
    .notNull()
    .references(() => profissional.id, { onDelete: "restrict" }),
  procedimentoId: text("procedimento_id")
    .notNull()
    .references(() => procedimento.id, { onDelete: "restrict" }),
  dataHoraInicio: timestamp("data_hora_inicio", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
  dataHoraFim: timestamp("data_hora_fim", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
  status: text("status").notNull(),
  origem: text("origem").notNull(),
  motivoCancelamento: text("motivo_cancelamento"),
});

export const lembreteIntencao = pgTable(
  "lembrete_intencao",
  {
    id: text("id").primaryKey(),
    agendamentoId: text("agendamento_id")
      .notNull()
      .references(() => agendamento.id, { onDelete: "cascade" }),
    clinicaId: text("clinica_id")
      .notNull()
      .references(() => clinica.id, { onDelete: "cascade" }),
    pacienteId: text("paciente_id")
      .notNull()
      .references(() => paciente.id, { onDelete: "cascade" }),
    profissionalId: text("profissional_id")
      .notNull()
      .references(() => profissional.id, { onDelete: "cascade" }),
    dataHoraConsulta: timestamp("data_hora_consulta", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    dataHoraEnvioPrevisto: timestamp("data_hora_envio_previsto", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    criadoEm: timestamp("criado_em", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("lembrete_intencao_agendamento_uidx").on(table.agendamentoId),
  ],
);
