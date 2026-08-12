import { z } from "zod";

import { SISTEMAS_FURCA } from "@/core/periograma/domain/ClassificacaoFurca";
import { TIPOS_PERIOGRAMA } from "@/core/periograma/domain/Periograma";
import {
  LADOS_SONDAGEM,
  POSICOES_SONDAGEM,
} from "@/core/periograma/domain/PontoSondagem";
import { ehDenteMultirradicular } from "@/core/periograma/domain/DentePeriograma";

const inteiroOpcional = z.number().int().nullable().optional();
const inteiroNaoNegativoOpcional = z.number().int().min(0).nullable().optional();
const booleanoOpcional = z.boolean().nullable().optional();

export const classificacaoFurcaSchema = z
  .object({
    sistema: z.enum(SISTEMAS_FURCA),
    grau: z.number().int(),
  })
  .superRefine((val, ctx) => {
    const max = val.sistema === "hamp" ? 3 : 4;
    if (val.grau < 1 || val.grau > max) {
      ctx.addIssue({
        code: "custom",
        message:
          val.sistema === "hamp"
            ? "Grau Hamp deve ser 1, 2 ou 3."
            : "Grau Glickman deve ser 1, 2, 3 ou 4.",
        path: ["grau"],
      });
    }
  });

export const pontoSondagemSchema = z.object({
  lado: z.enum(LADOS_SONDAGEM),
  posicao: z.enum(POSICOES_SONDAGEM),
  margemGengival: inteiroOpcional,
  profundidadeSondagem: inteiroNaoNegativoOpcional,
  placa: booleanoOpcional,
  sangramentoSondagem: booleanoOpcional,
});

export const dentePeriogramaInputSchema = z
  .object({
    numeroDente: z.number().int(),
    mobilidade: z.number().int().min(0).max(3).nullable().optional(),
    implante: booleanoOpcional,
    classificacaoFurca: classificacaoFurcaSchema.nullable().optional(),
    nota: z.string().max(2000).nullable().optional(),
    pontos: z.array(pontoSondagemSchema).max(6).optional(),
  })
  .superRefine((val, ctx) => {
    if (
      val.classificacaoFurca != null &&
      !ehDenteMultirradicular(val.numeroDente)
    ) {
      ctx.addIssue({
        code: "custom",
        message: `Classificação de furca não se aplica ao dente ${val.numeroDente}.`,
        path: ["classificacaoFurca"],
      });
    }
  });

export const registrarPeriogramaSchema = z.object({
  prontuarioId: z.string().uuid(),
  tipo: z.enum(TIPOS_PERIOGRAMA),
  dentes: z.array(dentePeriogramaInputSchema).min(1),
});

export const listarPeriogramasSchema = z.object({
  prontuarioId: z.string().uuid(),
});

export const consultarPeriogramaSchema = z.object({
  periogramaId: z.string().uuid(),
});

export type RegistrarPeriogramaInput = z.infer<typeof registrarPeriogramaSchema>;
export type DentePeriogramaInput = z.infer<typeof dentePeriogramaInputSchema>;
