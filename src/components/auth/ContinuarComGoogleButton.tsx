"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

type ContinuarComGoogleButtonProps = {
  onError?: (mensagem: string) => void;
  /** Retorne false para impedir o redirect OAuth (ex.: aceite legal). */
  onBeforeStart?: () => boolean;
  disabled?: boolean;
};

/**
 * Botão único de login social — mesmo fluxo em /login e /cadastro.
 * Destino pós-OAuth: `/auth/continuar`.
 */
export function ContinuarComGoogleButton({
  onError,
  onBeforeStart,
  disabled = false,
}: ContinuarComGoogleButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (onBeforeStart && !onBeforeStart()) return;
    setLoading(true);
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/auth/continuar",
      errorCallbackURL: "/login?erro=oauth",
    });
    if (error) {
      setLoading(false);
      onError?.(
        error.message ?? "Não foi possível continuar com Google. Tente novamente.",
      );
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="w-full cursor-pointer"
      disabled={disabled || loading}
      onClick={handleClick}
    >
      {loading ? "Redirecionando…" : "Continuar com Google"}
    </Button>
  );
}
