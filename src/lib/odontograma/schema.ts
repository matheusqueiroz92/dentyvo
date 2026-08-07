import { z } from "zod";

import {
  ehEstadoDenteInteiro,
  ehEstadoPorFace,
  ESTADOS_ODONTOGRAMA,
} from "@/core/odontograma/domain/EstadoOdontograma";
import { FACES_ODONTOGRAMA } from "@/core/odontograma/domain/FaceOdontograma";
import { NIVEIS_EVENTO_ODONTOGRAMA } from "@/core/odontograma/domain/EventoOdontograma";

export const eventoOdontogramaInputSchema = z
  .object({
    numeroDente: z.number().int(),
    nivel: z.enum(NIVEIS_EVENTO_ODONTOGRAMA),
    face: z.enum(FACES_ODONTOGRAMA).nullable().optional(),
    estadoNovo: z.enum(ESTADOS_ODONTOGRAMA),
    procedimentoId: z.string().uuid().nullable().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.nivel === "face" && (val.face == null || val.face === undefined)) {
      ctx.addIssue({
        code: "custom",
        message: "Face é obrigatória para evento de nível face.",
        path: ["face"],
      });
    }
    if (val.nivel === "dente" && val.face != null) {
      ctx.addIssue({
        code: "custom",
        message: "Evento de nível dente não deve informar face.",
        path: ["face"],
      });
    }
    if (val.nivel === "face" && !ehEstadoPorFace(val.estadoNovo)) {
      ctx.addIssue({
        code: "custom",
        message:
          "Este estado é de dente inteiro; selecione-o pelo controle do dente (não pela face).",
        path: ["estadoNovo"],
      });
    }
    if (val.nivel === "dente" && !ehEstadoDenteInteiro(val.estadoNovo)) {
      ctx.addIssue({
        code: "custom",
        message:
          "Este estado é por face; selecione-o clicando numa face do dente.",
        path: ["estadoNovo"],
      });
    }
  });

export const registrarEventosOdontogramaSchema = z.object({
  prontuarioId: z.string().uuid(),
  eventos: z.array(eventoOdontogramaInputSchema).min(1),
});

export const consultarOdontogramaSchema = z.object({
  prontuarioId: z.string().uuid(),
});

export const listarHistoricoOdontogramaSchema = z.object({
  prontuarioId: z.string().uuid(),
  numeroDente: z.number().int().optional(),
});
