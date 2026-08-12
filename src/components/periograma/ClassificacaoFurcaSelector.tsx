"use client";

import { ehDenteMultirradicular } from "@/core/periograma/domain/DentePeriograma";
import type { SistemaFurca } from "@/core/periograma/domain/ClassificacaoFurca";
import type { ClassificacaoFurcaDTO } from "@/lib/periograma/types";
import { ROTULOS_SISTEMA_FURCA } from "@/lib/periograma/helpers";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ClassificacaoFurcaSelectorProps = {
  numeroDente: number;
  value: ClassificacaoFurcaDTO | null;
  somenteLeitura?: boolean;
  onChange: (value: ClassificacaoFurcaDTO | null) => void;
  /** Mensagem de erro de validação (ex.: Hamp + grau 4). */
  erroGrau?: string | null;
};

const GRAUS_HAMP = [1, 2, 3] as const;
const GRAUS_GLICKMAN = [1, 2, 3, 4] as const;

/**
 * Seletor Hamp (1–3) / Glickman (1–4).
 * Só habilitado para molares/multirradiculares (mesma regra do domínio).
 */
export function ClassificacaoFurcaSelector({
  numeroDente,
  value,
  somenteLeitura = false,
  onChange,
  erroGrau = null,
}: ClassificacaoFurcaSelectorProps) {
  const aplicavel = ehDenteMultirradicular(numeroDente);

  if (!aplicavel) {
    return null;
  }

  const sistema: SistemaFurca | "" = value?.sistema ?? "";
  const graus =
    sistema === "glickman"
      ? GRAUS_GLICKMAN
      : sistema === "hamp"
        ? GRAUS_HAMP
        : [];

  return (
    <fieldset className="space-y-3 rounded-md border border-border p-3">
      <legend className="px-1 text-sm font-medium text-foreground">
        Classificação de furca
      </legend>
      <p className="text-[13px] text-muted-foreground">
        Opcional. Hamp (rotina, graus I–III) ou Glickman (aguda, I–IV). Sistemas
        não são comparáveis entre si.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="furca-sistema">Sistema</Label>
          <Select
            value={sistema || "__none__"}
            disabled={somenteLeitura}
            onValueChange={(v) => {
              if (v === "__none__") {
                onChange(null);
                return;
              }
              const novoSistema = v as SistemaFurca;
              const max = novoSistema === "hamp" ? 3 : 4;
              const grauAtual = value?.grau;
              onChange({
                sistema: novoSistema,
                grau:
                  grauAtual != null && grauAtual >= 1 && grauAtual <= max
                    ? grauAtual
                    : 1,
              });
            }}
          >
            <SelectTrigger
              id="furca-sistema"
              className="min-h-11 w-full"
              disabled={somenteLeitura}
            >
              <SelectValue placeholder="Sem avaliação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Sem avaliação</SelectItem>
              <SelectItem value="hamp">{ROTULOS_SISTEMA_FURCA.hamp}</SelectItem>
              <SelectItem value="glickman">
                {ROTULOS_SISTEMA_FURCA.glickman}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="furca-grau">Grau</Label>
          <Select
            value={value?.grau != null ? String(value.grau) : ""}
            disabled={somenteLeitura || !sistema}
            onValueChange={(v) => {
              if (!sistema) return;
              const grau = Number(v);
              const max = sistema === "hamp" ? 3 : 4;
              if (grau < 1 || grau > max) return;
              onChange({ sistema, grau });
            }}
          >
            <SelectTrigger
              id="furca-grau"
              className="min-h-11 w-full"
              disabled={somenteLeitura || !sistema}
              aria-invalid={erroGrau ? true : undefined}
            >
              <SelectValue placeholder="Selecione o grau" />
            </SelectTrigger>
            <SelectContent>
              {graus.map((g) => (
                <SelectItem key={g} value={String(g)}>
                  Grau {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {erroGrau ? (
            <p className="text-[13px] text-destructive" role="alert">
              {erroGrau}
            </p>
          ) : null}
        </div>
      </div>
    </fieldset>
  );
}
