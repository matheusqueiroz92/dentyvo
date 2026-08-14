import { z } from "zod";

export const MENSAGEM_DESCRICAO_CURTA =
  "Descreva com pelo menos 10 caracteres.";

const nomeSchema = z
  .string()
  .trim()
  .min(1, "Informe o nome.")
  .max(120, "Nome muito longo.");

const textoLongoSchema = z
  .string()
  .trim()
  .min(10, MENSAGEM_DESCRICAO_CURTA)
  .max(4000, "Texto muito longo.");

export const contatoLandingSchema = z.object({
  nome: nomeSchema,
  email: z.string().trim().email("Informe um e-mail válido."),
  mensagem: textoLongoSchema,
});

export const contatoSuporteSchema = z.object({
  nome: nomeSchema,
  assunto: z
    .string()
    .trim()
    .min(1, "Informe o assunto.")
    .max(200, "Assunto muito longo."),
  descricao: textoLongoSchema,
  tipo: z.enum(["duvida", "bug"]),
});

export type ContatoLandingValues = z.infer<typeof contatoLandingSchema>;
export type ContatoSuporteValues = z.infer<typeof contatoSuporteSchema>;
export type TipoContato = ContatoSuporteValues["tipo"];
