import { DadosInvalidosError } from "@/core/shared/errors";

/**
 * Destinatário XOR: usuário de clínica **ou** usuário da plataforma (spec 011).
 */
export type DestinatarioNotificacao =
  | { kind: "usuario"; usuarioId: string }
  | { kind: "usuario_plataforma"; usuarioPlataformaId: string };

export function destinatarioUsuario(usuarioId: string): DestinatarioNotificacao {
  return { kind: "usuario", usuarioId };
}

export function destinatarioUsuarioPlataforma(
  usuarioPlataformaId: string,
): DestinatarioNotificacao {
  return { kind: "usuario_plataforma", usuarioPlataformaId };
}

export function mesmosDestinatarios(
  a: DestinatarioNotificacao,
  b: DestinatarioNotificacao,
): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "usuario" && b.kind === "usuario") {
    return a.usuarioId === b.usuarioId;
  }
  if (a.kind === "usuario_plataforma" && b.kind === "usuario_plataforma") {
    return a.usuarioPlataformaId === b.usuarioPlataformaId;
  }
  return false;
}

export function destinatarioDeCampos(input: {
  destinatarioUsuarioId: string | null;
  destinatarioUsuarioPlataformaId: string | null;
}): DestinatarioNotificacao {
  const temUsuario = input.destinatarioUsuarioId != null;
  const temPlataforma = input.destinatarioUsuarioPlataformaId != null;
  if (temUsuario === temPlataforma) {
    throw new DadosInvalidosError(
      "Destinatário inválido: informe exatamente um entre usuario e usuario_plataforma.",
    );
  }
  if (temUsuario) {
    return {
      kind: "usuario",
      usuarioId: input.destinatarioUsuarioId as string,
    };
  }
  return {
    kind: "usuario_plataforma",
    usuarioPlataformaId: input.destinatarioUsuarioPlataformaId as string,
  };
}
