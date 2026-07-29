import type { CriarClinicaComAdmin } from "@/core/auth/application/use-cases/CriarClinicaComAdmin";
import type { CriarClinicaComAdminInput } from "@/core/auth/application/use-cases/CriarClinicaComAdmin";
import type { Clinica } from "@/core/auth/domain/Clinica";
import type { IniciarTrial } from "@/core/assinatura/application/use-cases/IniciarTrial";

export type CadastrarClinicaComTrialDeps = {
  criarClinicaComAdmin: Pick<CriarClinicaComAdmin, "executar">;
  iniciarTrial: Pick<IniciarTrial, "executar">;
  /** Default: `console.error`. Injetável nos testes. */
  logError?: (mensagem: string, erro: unknown) => void;
};

function logErrorPadrao(mensagem: string, erro: unknown): void {
  console.error(mensagem, erro);
}

/**
 * Orquestração de delivery (spec 010): após `CriarClinicaComAdmin` suceder,
 * dispara `IniciarTrial` para a clínica recém-criada.
 *
 * Vive em `src/actions` — **não** altera `src/core/auth` nem `src/core/assinatura`.
 *
 * Se `IniciarTrial` falhar depois de `CriarClinicaComAdmin` já ter sucedido:
 * **não** revertemos a criação da clínica. Registramos o erro e permitimos
 * que o trial seja iniciado depois (retry ou suporte). Uma falha no trial
 * não pode impedir a clínica de existir.
 */
export async function cadastrarClinicaComTrial(
  deps: CadastrarClinicaComTrialDeps,
  input: CriarClinicaComAdminInput,
): Promise<Clinica> {
  const clinica = await deps.criarClinicaComAdmin.executar(input);

  try {
    await deps.iniciarTrial.executar({ clinicaId: clinica.id });
  } catch (erro) {
    // Sem rollback da clínica — ver JSDoc acima.
    (deps.logError ?? logErrorPadrao)(
      `IniciarTrial falhou após criar clínica ${clinica.id}; clínica mantida sem trial. Retry/suporte pode iniciar o trial depois.`,
      erro,
    );
  }

  // TODO(spec-011): disparar notificação de boas-vindas após o cadastro
  // (módulo de notificações). Spec 011 ainda em rascunho — não implementar
  // até passar pelo Arquiteto/Implementador.

  return clinica;
}
