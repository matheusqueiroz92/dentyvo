import { z } from "zod";

import { SECOES_ANAMNESE } from "@/core/anamnese/domain/RespostasAnamnese";

const secaoSchema = z
  .object({
    texto: z.string(),
    negado: z.boolean(),
  })
  .superRefine((secao, ctx) => {
    const texto = secao.texto.trim();
    if (!secao.negado && !texto) {
      ctx.addIssue({
        code: "custom",
        message: "Informe o texto ou marque “nada a declarar / nega”.",
        path: ["texto"],
      });
    }
  });

export const anamneseFormSchema = z.object({
  historicoMedico: secaoSchema,
  alergias: secaoSchema,
  medicacoesEmUso: secaoSchema,
  condicoesPreexistentes: secaoSchema,
});

export type AnamneseFormValues = z.infer<typeof anamneseFormSchema>;

export const SECAO_ANAMNESE_LABELS: Record<
  (typeof SECOES_ANAMNESE)[number],
  string
> = {
  historicoMedico: "Histórico médico",
  alergias: "Alergias",
  medicacoesEmUso: "Medicações em uso",
  condicoesPreexistentes: "Condições preexistentes",
};

export const SECOES_ANAMNESE_FORM = SECOES_ANAMNESE;

export function secaoVazia(): AnamneseFormValues["historicoMedico"] {
  return { texto: "", negado: false };
}

export const registrarEvolucaoFormSchema = z.object({
  descricao: z.string().trim().min(1, "Informe a descrição da evolução."),
  procedimentoId: z.string().optional(),
});

export type RegistrarEvolucaoFormValues = z.infer<
  typeof registrarEvolucaoFormSchema
>;

export const retificarEvolucaoFormSchema = z.object({
  descricao: z.string().trim().min(1, "Informe a nova descrição."),
  motivoRetificacao: z
    .string()
    .trim()
    .min(1, "Informe o motivo da retificação."),
});

export type RetificarEvolucaoFormValues = z.infer<
  typeof retificarEvolucaoFormSchema
>;

export function respostasParaForm(
  respostas: AnamneseFormValues | null | undefined,
): AnamneseFormValues {
  if (!respostas) {
    return {
      historicoMedico: secaoVazia(),
      alergias: secaoVazia(),
      medicacoesEmUso: secaoVazia(),
      condicoesPreexistentes: secaoVazia(),
    };
  }
  return {
    historicoMedico: {
      texto: respostas.historicoMedico.texto ?? "",
      negado: respostas.historicoMedico.negado,
    },
    alergias: {
      texto: respostas.alergias.texto ?? "",
      negado: respostas.alergias.negado,
    },
    medicacoesEmUso: {
      texto: respostas.medicacoesEmUso.texto ?? "",
      negado: respostas.medicacoesEmUso.negado,
    },
    condicoesPreexistentes: {
      texto: respostas.condicoesPreexistentes.texto ?? "",
      negado: respostas.condicoesPreexistentes.negado,
    },
  };
}
