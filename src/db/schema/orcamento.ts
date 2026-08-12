import { sql } from "drizzle-orm";
import {
  check,
  date,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { clinica } from "./clinica";
import { profissional } from "./profissional";
import { prontuario } from "./prontuario";

/**
 * Orçamentos comerciais vinculados ao prontuário (spec 015).
 * Conteúdo imutável após emissão; só `status` transiciona.
 * PDF sob demanda — sem blob.
 */
export const orcamento = pgTable(
  "orcamento",
  {
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
    status: text("status").notNull(),
    /** Snapshot congelado na emissão (clínica, profissional, paciente). */
    cabecalho: jsonb("cabecalho").notNull(),
    /** Data civil informativa; null = sem prazo. Não altera status. */
    validoAte: date("valido_ate", { mode: "date" }),
    emitidoEm: timestamp("emitido_em", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
  },
  (t) => [
    check(
      "orcamento_status_check",
      sql`${t.status} IN ('enviado', 'aceito', 'recusado')`,
    ),
  ],
);

/**
 * Itens do orçamento — tabela normalizada (não JSON).
 * Nome/valor são snapshots; `procedimento_id` é referência histórica
 * (sem FK — cadastro de procedimento pode mudar depois).
 */
export const itemOrcamento = pgTable(
  "item_orcamento",
  {
    id: text("id").primaryKey(),
    orcamentoId: text("orcamento_id")
      .notNull()
      .references(() => orcamento.id, { onDelete: "cascade" }),
    procedimentoId: text("procedimento_id").notNull(),
    nome: text("nome").notNull(),
    valor: doublePrecision("valor").notNull(),
    quantidade: integer("quantidade").notNull(),
    /** Ordem estável na emissão / PDF. */
    ordem: integer("ordem").notNull(),
  },
  (t) => [
    check("item_orcamento_quantidade_check", sql`${t.quantidade} >= 1`),
    check("item_orcamento_valor_check", sql`${t.valor} >= 0`),
    uniqueIndex("item_orcamento_orcamento_ordem_uidx").on(
      t.orcamentoId,
      t.ordem,
    ),
  ],
);
