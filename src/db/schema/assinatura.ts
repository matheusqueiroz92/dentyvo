import {
  check,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { clinica } from "./clinica";

/**
 * Planos comerciais da Dentyvo (spec 010).
 * `limites_de_uso` modelado, sem enforcement no MVP.
 */
export const plano = pgTable("plano", {
  id: text("id").primaryKey(),
  nome: text("nome").notNull(),
  valorMensal: doublePrecision("valor_mensal").notNull(),
  limitesDeUso: jsonb("limites_de_uso")
    .$type<Record<string, number | undefined>>()
    .notNull()
    .default({}),
});

/**
 * Assinatura da clínica (trial / paga / inadimplente).
 * Ids de gateway são opacos (provedor agnóstico).
 * Campos promocionais (012): cópia operacional; fonte de verdade = vaga.
 */
export const assinatura = pgTable(
  "assinatura",
  {
    id: text("id").primaryKey(),
    clinicaId: text("clinica_id")
      .notNull()
      .references(() => clinica.id, { onDelete: "cascade" }),
    planoId: text("plano_id").references(() => plano.id),
    status: text("status").notNull(),
    gatewayClienteId: text("gateway_cliente_id"),
    gatewayAssinaturaId: text("gateway_assinatura_id"),
    dataInicio: timestamp("data_inicio", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    dataFimTrial: timestamp("data_fim_trial", {
      withTimezone: true,
      mode: "date",
    }),
    dataProximaCobranca: timestamp("data_proxima_cobranca", {
      withTimezone: true,
      mode: "date",
    }),
    dataCanceladaEm: timestamp("data_cancelada_em", {
      withTimezone: true,
      mode: "date",
    }),
    acessoManualAte: timestamp("acesso_manual_ate", {
      withTimezone: true,
      mode: "date",
    }),
    acessoManualMotivo: text("acesso_manual_motivo"),
    precoPromocionalCentavos: integer("preco_promocional_centavos"),
    precoPromocionalAte: timestamp("preco_promocional_ate", {
      withTimezone: true,
      mode: "date",
    }),
    avisoAumentoPrecoEnviadoEm: timestamp("aviso_aumento_preco_enviado_em", {
      withTimezone: true,
      mode: "date",
    }),
    migradaParaPrecoCheioEm: timestamp("migrada_para_preco_cheio_em", {
      withTimezone: true,
      mode: "date",
    }),
  },
  (t) => [
    uniqueIndex("assinatura_clinica_id_uidx").on(t.clinicaId),
    uniqueIndex("assinatura_gateway_assinatura_id_uidx").on(
      t.gatewayAssinaturaId,
    ),
  ],
);

/**
 * Cupom de lançamento — fonte de verdade da reserva (spec 012, D3/D6).
 * PK + CHECK em `posicao` (1..30); UNIQUE em `clinica_id`.
 */
export const vagaPromocionalLancamento = pgTable(
  "vaga_promocional_lancamento",
  {
    posicao: smallint("posicao").primaryKey(),
    clinicaId: text("clinica_id")
      .notNull()
      .references(() => clinica.id, { onDelete: "restrict" }),
    assinaturaId: text("assinatura_id")
      .notNull()
      .references(() => assinatura.id, { onDelete: "restrict" }),
    reservadaEm: timestamp("reservada_em", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
  },
  (t) => [
    uniqueIndex("vaga_promocional_lancamento_clinica_id_uidx").on(t.clinicaId),
    check(
      "vaga_promocional_lancamento_posicao_check",
      sql`${t.posicao} >= 1 AND ${t.posicao} <= 30`,
    ),
  ],
);

export const cobranca = pgTable(
  "cobranca",
  {
    id: text("id").primaryKey(),
    assinaturaId: text("assinatura_id")
      .notNull()
      .references(() => assinatura.id, { onDelete: "cascade" }),
    gatewayCobrancaId: text("gateway_cobranca_id").notNull(),
    valor: doublePrecision("valor").notNull(),
    metodo: text("metodo").notNull(),
    status: text("status").notNull(),
    vencimento: timestamp("vencimento", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    pagaEm: timestamp("paga_em", { withTimezone: true, mode: "date" }),
    vencidaEm: timestamp("vencida_em", { withTimezone: true, mode: "date" }),
    linkPagamento: text("link_pagamento"),
  },
  (t) => [
    uniqueIndex("cobranca_gateway_cobranca_id_uidx").on(t.gatewayCobrancaId),
  ],
);

/** Idempotência de webhooks (entrega at-least-once). */
export const eventoWebhookProcessado = pgTable("evento_webhook_processado", {
  eventoId: text("evento_id").primaryKey(),
  processadoEm: timestamp("processado_em", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
});
