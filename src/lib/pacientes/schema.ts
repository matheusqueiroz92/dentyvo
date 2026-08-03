import { z } from "zod";

import { apenasDigitos, cpfEhValido } from "./cpf";

export const pacienteFormSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(1, "Informe o nome do paciente.")
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
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.")
    .refine((v) => {
      const [y, m, d] = v.split("-").map(Number);
      const date = new Date(y!, m! - 1, d!);
      return (
        date.getFullYear() === y &&
        date.getMonth() === m! - 1 &&
        date.getDate() === d &&
        date.getTime() <= Date.now()
      );
    }, "Data de nascimento inválida."),
  contatoEmergencia: z.string().max(200, "Contato muito longo.").optional(),
});

export type PacienteFormValues = z.infer<typeof pacienteFormSchema>;
