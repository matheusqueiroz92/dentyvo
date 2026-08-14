import type { EditarDadosClinicaFormValues } from "./schema";

export type PatchAtualizacaoClinica = {
  nome?: string;
  endereco?: string;
};

/**
 * Monta o input parcial de `AtualizarClinica`: só campos cujo valor
 * (após trim) difere do atual. Campo inalterado ou vazio é omitido —
 * não reenvia o valor antigo como se fosse alteração.
 */
export function montarPatchAtualizacaoClinica(
  values: EditarDadosClinicaFormValues,
  atual: { nome: string; endereco: string },
): PatchAtualizacaoClinica | null {
  const nome = values.nome.trim();
  const endereco = values.endereco.trim();
  const patch: PatchAtualizacaoClinica = {};

  if (nome && nome !== atual.nome) {
    patch.nome = nome;
  }
  if (endereco && endereco !== atual.endereco) {
    patch.endereco = endereco;
  }

  if (patch.nome === undefined && patch.endereco === undefined) {
    return null;
  }
  return patch;
}
