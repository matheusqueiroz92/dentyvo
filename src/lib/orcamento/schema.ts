import { z } from "zod";

const itemEmitirSchema = z.object({
  procedimentoId: z
    .string()
    .min(1, "Selecione o procedimento.")
    .uuid("Selecione o procedimento."),
  valor: z
    .number({ error: "Informe um valor válido." })
    .finite("Informe um valor válido.")
    .min(0, "O valor deve ser maior ou igual a zero."),
  quantidade: z
    .number({ error: "Informe a quantidade." })
    .int("A quantidade deve ser um número inteiro.")
    .min(1, "A quantidade mínima é 1."),
});

export const emitirOrcamentoFormSchema = z.object({
  itens: z
    .array(itemEmitirSchema)
    .min(1, "Inclua ao menos um item no orçamento."),
  validoAte: z
    .string()
    .refine(
      (valor) => valor === "" || /^\d{4}-\d{2}-\d{2}$/.test(valor),
      "Informe uma data válida.",
    ),
});

export type EmitirOrcamentoFormValues = z.infer<typeof emitirOrcamentoFormSchema>;

export function itemOrcamentoVazio(): EmitirOrcamentoFormValues["itens"][number] {
  return {
    procedimentoId: "",
    valor: 0,
    quantidade: 1,
  };
}

export function valoresIniciaisOrcamento(): EmitirOrcamentoFormValues {
  return {
    itens: [itemOrcamentoVazio()],
    validoAte: "",
  };
}

export const listarOrcamentosSchema = z.object({
  prontuarioId: z.string().uuid(),
});

export const emitirOrcamentoActionSchema = z.object({
  prontuarioId: z.string().uuid(),
  itens: z.array(itemEmitirSchema).min(1),
  validoAte: z
    .string()
    .refine(
      (valor) => valor === "" || /^\d{4}-\d{2}-\d{2}$/.test(valor),
      "Informe uma data válida.",
    ),
});

export const orcamentoIdSchema = z.object({
  orcamentoId: z.string().uuid(),
});

export const contextoOrcamentoSchema = z.object({
  pacienteId: z.string().uuid(),
});
