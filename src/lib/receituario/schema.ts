import { z } from "zod";

const campoItem = (rotulo: string) =>
  z.string().trim().min(1, `Informe ${rotulo}.`);

export const itemReceitaFormSchema = z.object({
  medicamento: campoItem("o medicamento"),
  dosagem: campoItem("a dosagem"),
  posologia: campoItem("a posologia"),
  duracao: campoItem("a duração"),
});

export type ItemReceitaFormValues = z.infer<typeof itemReceitaFormSchema>;

export const emitirReceitaFormSchema = z.object({
  itens: z
    .array(itemReceitaFormSchema)
    .min(1, "Adicione ao menos um item na receita."),
});

export type EmitirReceitaFormValues = z.infer<typeof emitirReceitaFormSchema>;

export function itemReceitaVazio(): ItemReceitaFormValues {
  return {
    medicamento: "",
    dosagem: "",
    posologia: "",
    duracao: "",
  };
}

export const listarReceitasSchema = z.object({
  prontuarioId: z.string().uuid(),
});

export const emitirReceitaActionSchema = z.object({
  prontuarioId: z.string().uuid(),
  itens: z
    .array(itemReceitaFormSchema)
    .min(1, "Adicione ao menos um item na receita."),
});

export const gerarPdfReceitaSchema = z.object({
  receitaId: z.string().uuid(),
});
