import { z } from "zod";

/** Espelha `Clinica.atualizarDadosCadastrais` (P1 — pelo menos um informado). */
export const MENSAGEM_PELO_MENOS_UM_CAMPO =
  "Informe ao menos nome ou endereço para atualizar a clínica.";

export const editarDadosClinicaFormSchema = z
  .object({
    nome: z.string(),
    endereco: z.string(),
  })
  .superRefine((data, ctx) => {
    if (!data.nome.trim() && !data.endereco.trim()) {
      ctx.addIssue({
        code: "custom",
        message: MENSAGEM_PELO_MENOS_UM_CAMPO,
        path: ["nome"],
      });
      ctx.addIssue({
        code: "custom",
        message: MENSAGEM_PELO_MENOS_UM_CAMPO,
        path: ["endereco"],
      });
    }
  });

export type EditarDadosClinicaFormValues = z.infer<
  typeof editarDadosClinicaFormSchema
>;
