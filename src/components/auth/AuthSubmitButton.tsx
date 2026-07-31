"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type AuthSubmitButtonProps = {
  isLoading: boolean;
  idleLabel: string;
  loadingLabel: string;
  className?: string;
};

/** Botão de submit dos formulários de auth com spinner + disabled. */
export function AuthSubmitButton({
  isLoading,
  idleLabel,
  loadingLabel,
  className = "w-full cursor-pointer",
}: AuthSubmitButtonProps) {
  return (
    <Button
      type="submit"
      variant="primary"
      size="lg"
      className={className}
      disabled={isLoading}
      aria-busy={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2
            data-testid="auth-submit-spinner"
            className="size-[18px] animate-spin"
            aria-hidden
          />
          {loadingLabel}
        </>
      ) : (
        idleLabel
      )}
    </Button>
  );
}
