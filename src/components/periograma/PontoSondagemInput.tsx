"use client";

import type { PontoSondagemDTO } from "@/lib/periograma/types";
import { ROTULOS_POSICAO } from "@/lib/periograma/helpers";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type PontoSondagemInputProps = {
  ponto: PontoSondagemDTO;
  somenteLeitura?: boolean;
  onChange: (proximo: PontoSondagemDTO) => void;
  className?: string;
};

function parseInteiroOpcional(raw: string): number | null {
  const t = raw.trim();
  if (t === "" || t === "-" || t === "+") return null;
  const n = Number(t);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return null;
  return n;
}

/**
 * Campos de um ponto de sondagem (margem, profundidade, placa, sangramento).
 */
export function PontoSondagemInput({
  ponto,
  somenteLeitura = false,
  onChange,
  className,
}: PontoSondagemInputProps) {
  const idBase = `ponto-${ponto.lado}-${ponto.posicao}`;

  return (
    <div
      className={cn(
        "rounded-md border border-border bg-background/50 p-3 space-y-3",
        className,
      )}
      data-lado={ponto.lado}
      data-posicao={ponto.posicao}
    >
      <p className="text-xs font-medium text-muted-foreground">
        {ROTULOS_POSICAO[ponto.posicao]}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${idBase}-mg`}>Margem gengival (mm)</Label>
          <Input
            id={`${idBase}-mg`}
            type="number"
            inputMode="numeric"
            className="min-h-11 tabular-nums"
            disabled={somenteLeitura}
            readOnly={somenteLeitura}
            value={ponto.margemGengival ?? ""}
            placeholder="—"
            onChange={(e) =>
              onChange({
                ...ponto,
                margemGengival: parseInteiroOpcional(e.target.value),
              })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${idBase}-ps`}>Profundidade (mm)</Label>
          <Input
            id={`${idBase}-ps`}
            type="number"
            inputMode="numeric"
            min={0}
            className="min-h-11 tabular-nums"
            disabled={somenteLeitura}
            readOnly={somenteLeitura}
            value={ponto.profundidadeSondagem ?? ""}
            placeholder="—"
            onChange={(e) => {
              const v = parseInteiroOpcional(e.target.value);
              onChange({
                ...ponto,
                profundidadeSondagem: v != null && v < 0 ? null : v,
              });
            }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex min-h-11 items-center gap-2 text-[13px]">
          <Checkbox
            checked={ponto.placa === true}
            disabled={somenteLeitura}
            onCheckedChange={(checked) =>
              onChange({
                ...ponto,
                placa: checked === true ? true : null,
              })
            }
          />
          Placa
        </label>
        <label className="flex min-h-11 items-center gap-2 text-[13px]">
          <Checkbox
            checked={ponto.sangramentoSondagem === true}
            disabled={somenteLeitura}
            onCheckedChange={(checked) =>
              onChange({
                ...ponto,
                sangramentoSondagem: checked === true ? true : null,
              })
            }
          />
          Sangramento à sondagem
        </label>
      </div>
    </div>
  );
}
