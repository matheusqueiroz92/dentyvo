import { createSafeActionClient } from "next-safe-action";

/**
 * Erro de domínio tipado neste projeto (`readonly nome = "..."`).
 * Usado para decidir o que a UI pode ver em `result.serverError`.
 */
function isErroDeDominio(
  error: unknown,
): error is Error & { nome: string } {
  return (
    error instanceof Error &&
    "nome" in error &&
    typeof (error as { nome: unknown }).nome === "string" &&
    (error as { nome: string }).nome.length > 0
  );
}

export type ServerActionError = {
  /** Código estável para a UI (ex.: DocumentoClinicaDuplicadoError). */
  codigo: string;
  /** Mensagem em português, utilizável em formulário/toast. */
  mensagem: string;
};

/**
 * Cliente base de server actions (next-safe-action).
 * Actions concretas vivem em `src/actions/`.
 *
 * - Validação de entrada: cada action declara `.inputSchema(zod…)` — falhas
 *   viram `validationErrors` no cliente (não stack).
 * - Erros de domínio: `serverError` = `{ codigo, mensagem }` (sem stack).
 * - Demais falhas: mensagem genérica; detalhe só no log do servidor.
 */
export const actionClient = createSafeActionClient({
  handleServerError(error): ServerActionError {
    console.error("[safe-action]", error);

    if (isErroDeDominio(error)) {
      return {
        codigo: error.nome,
        mensagem: error.message,
      };
    }

    return {
      codigo: "ErroInesperado",
      mensagem: "Não foi possível concluir a operação. Tente novamente.",
    };
  },
});
