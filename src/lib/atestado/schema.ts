import { z } from "zod";

import { CID_10_FORMATO } from "@/core/atestado/domain/Cid";

const dataCivilIso = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data de início.");

const cidOpcionalSchema = z
  .string()
  .trim()
  .transform((valor) => (valor === "" ? undefined : valor.toUpperCase()))
  .refine(
    (valor) => valor === undefined || CID_10_FORMATO.test(valor),
    "CID inválido: use o formato CID-10 (ex.: K08.1) ou deixe em branco.",
  );

export const emitirAtestadoFormSchema = z.object({
  motivo: z.string().trim().min(1, "Informe o motivo ou finalidade."),
  cid: cidOpcionalSchema.optional(),
  dataInicio: dataCivilIso,
  quantidadeDias: z.coerce
    .number()
    .int("A quantidade de dias deve ser um número inteiro.")
    .min(1, "Informe ao menos 1 dia de afastamento."),
});

export type EmitirAtestadoFormValues = z.infer<typeof emitirAtestadoFormSchema>;

export function valoresIniciaisAtestado(
  dataInicio = "",
): EmitirAtestadoFormValues {
  return {
    motivo: "",
    cid: undefined,
    dataInicio,
    quantidadeDias: 1,
  };
}

export const listarAtestadosSchema = z.object({
  prontuarioId: z.string().uuid(),
});

export const emitirAtestadoActionSchema = emitirAtestadoFormSchema.extend({
  prontuarioId: z.string().uuid(),
});

export const gerarPdfAtestadoSchema = z.object({
  atestadoId: z.string().uuid(),
});
