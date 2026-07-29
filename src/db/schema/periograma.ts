import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { clinica } from "./clinica";
import { profissional } from "./profissional";
import { prontuario } from "./prontuario";

/**
 * Cabeçalho do periograma — append-only / imutável (spec 005).
 * Correção = nova linha com `tipo = reavaliacao`.
 */
export const periograma = pgTable("periograma", {
  id: text("id").primaryKey(),
  clinicaId: text("clinica_id")
    .notNull()
    .references(() => clinica.id, { onDelete: "cascade" }),
  prontuarioId: text("prontuario_id")
    .notNull()
    .references(() => prontuario.id, { onDelete: "cascade" }),
  profissionalId: text("profissional_id")
    .notNull()
    .references(() => profissional.id, { onDelete: "restrict" }),
  tipo: text("tipo").notNull(),
  registradoEm: timestamp("registrado_em", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
});

/**
 * Avaliações no nível do dente — tabela normalizada (não JSON).
 */
export const periogramaDente = pgTable(
  "periograma_dente",
  {
    id: text("id").primaryKey(),
    periogramaId: text("periograma_id")
      .notNull()
      .references(() => periograma.id, { onDelete: "cascade" }),
    numeroDente: integer("numero_dente").notNull(),
    mobilidade: integer("mobilidade"),
    implante: boolean("implante"),
    /** Null = sem avaliação de furca. */
    furcaSistema: text("furca_sistema"),
    furcaGrau: integer("furca_grau"),
    nota: text("nota"),
  },
  (t) => [
    uniqueIndex("periograma_dente_periograma_numero_uidx").on(
      t.periogramaId,
      t.numeroDente,
    ),
  ],
);

/**
 * Pontos de sondagem (até 6 por dente) — tabela normalizada (não JSON).
 */
export const periogramaPontoSondagem = pgTable(
  "periograma_ponto_sondagem",
  {
    id: text("id").primaryKey(),
    periogramaDenteId: text("periograma_dente_id")
      .notNull()
      .references(() => periogramaDente.id, { onDelete: "cascade" }),
    lado: text("lado").notNull(),
    posicao: text("posicao").notNull(),
    margemGengival: integer("margem_gengival"),
    profundidadeSondagem: integer("profundidade_sondagem"),
    placa: boolean("placa"),
    sangramentoSondagem: boolean("sangramento_sondagem"),
  },
  (t) => [
    uniqueIndex("periograma_ponto_dente_lado_posicao_uidx").on(
      t.periogramaDenteId,
      t.lado,
      t.posicao,
    ),
  ],
);
