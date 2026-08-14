import { z } from "zod";

import { PAPEIS } from "@/core/auth/domain/Papel";

import { MENSAGEM_CRO_OBRIGATORIO } from "./rotulos";

function exigirCroSeDentista(
  data: { papel: string; cro: string },
  ctx: z.RefinementCtx,
) {
  if (data.papel === "dentista" && !data.cro.trim()) {
    ctx.addIssue({
      code: "custom",
      message: MENSAGEM_CRO_OBRIGATORIO,
      path: ["cro"],
    });
  }
}

export const convidarUsuarioFormSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, "Informe o e-mail.")
      .email("Informe um e-mail válido.")
      .transform((v) => v.toLowerCase()),
    papel: z.enum(PAPEIS),
    cro: z.string(),
  })
  .superRefine(exigirCroSeDentista);

export type ConvidarUsuarioFormValues = z.infer<
  typeof convidarUsuarioFormSchema
>;

export const editarPapelFormSchema = z
  .object({
    papel: z.enum(PAPEIS),
    cro: z.string(),
  })
  .superRefine(exigirCroSeDentista);

export type EditarPapelFormValues = z.infer<typeof editarPapelFormSchema>;
