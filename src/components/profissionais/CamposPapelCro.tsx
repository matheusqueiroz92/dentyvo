"use client";

import { useFormContext } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PAPEIS, type Papel } from "@/core/auth/domain/Papel";
import { ROTULO_PAPEL } from "@/lib/profissionais/rotulos";
import { cn } from "@/lib/utils";

type CamposPapelCroProps = {
  mostrarCroHint?: boolean;
};

const selectClassName = cn(
  "flex min-h-11 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
);

/** Papel + CRO condicional (obrigatório só para dentista). */
export function CamposPapelCro({
  mostrarCroHint = false,
}: CamposPapelCroProps) {
  const form = useFormContext<{ papel: Papel; cro: string }>();
  const papel = form.watch("papel");
  const mostrarCro = papel === "dentista";

  return (
    <>
      <FormField
        control={form.control}
        name="papel"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Papel</FormLabel>
            <FormControl>
              <select className={selectClassName} {...field}>
                {PAPEIS.map((p) => (
                  <option key={p} value={p}>
                    {ROTULO_PAPEL[p]}
                  </option>
                ))}
              </select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {mostrarCro ? (
        <FormField
          control={form.control}
          name="cro"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CRO</FormLabel>
              <FormControl>
                <Input className="min-h-11" autoComplete="off" {...field} />
              </FormControl>
              {mostrarCroHint ? (
                <p className="text-[13px] leading-5 text-muted-foreground">
                  O CRO é exigido para dentista. No convite, a pessoa também
                  informa o CRO ao aceitar.
                </p>
              ) : null}
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}
    </>
  );
}
