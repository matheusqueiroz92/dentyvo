import { z } from "zod";

import { apenasDigitos, cpfEhValido } from "@/lib/pacientes/cpf";

/** Schema do formulário público — espelha MarcarConsultaViaLinkPublico. */
export const pacientePublicoFormSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(1, "Informe seu nome.")
    .max(200, "Nome muito longo."),
  cpf: z
    .string()
    .min(1, "Informe o CPF.")
    .refine((v) => cpfEhValido(v), "CPF inválido."),
  telefone: z
    .string()
    .min(1, "Informe o telefone.")
    .refine((v) => {
      const d = apenasDigitos(v);
      return d.length >= 10 && d.length <= 11;
    }, "Telefone inválido."),
  dataNascimento: z
    .string()
    .min(1, "Informe a data de nascimento.")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida."),
  aceiteComunicacaoLembretes: z
    .boolean()
    .refine((v) => v === true, {
      message: "É necessário aceitar a comunicação de lembretes.",
    }),
});

export type PacientePublicoFormValues = z.infer<typeof pacientePublicoFormSchema>;
