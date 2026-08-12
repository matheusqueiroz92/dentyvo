"use client";

import { useState } from "react";

import { IlustracaoTipoDente } from "@/components/odontograma/IlustracaoTipoDente";
import { ClassificacaoFurcaSelector } from "@/components/periograma/ClassificacaoFurcaSelector";
import { PontoSondagemInput } from "@/components/periograma/PontoSondagemInput";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { classificacaoFurcaSchema } from "@/lib/periograma/schema";
import {
  dentePeriogramaVazio,
  mesclarPontosComPadrao,
  ROTULOS_LADO,
} from "@/lib/periograma/helpers";
import type {
  ClassificacaoFurcaDTO,
  DentePeriogramaDTO,
  PontoSondagemDTO,
} from "@/lib/periograma/types";

type DentePeriogramaPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  numeroDente: number | null;
  /** Dados iniciais (sessão ou exame em leitura). */
  valorInicial: DentePeriogramaDTO | null;
  somenteLeitura?: boolean;
  onConfirmar?: (dente: DentePeriogramaDTO) => void;
};

function montarRascunho(
  numeroDente: number,
  valorInicial: DentePeriogramaDTO | null,
): DentePeriogramaDTO {
  if (valorInicial) {
    return {
      ...valorInicial,
      pontos: mesclarPontosComPadrao(valorInicial.pontos),
    };
  }
  return dentePeriogramaVazio(numeroDente);
}

export function DentePeriogramaPanel({
  open,
  onOpenChange,
  numeroDente,
  valorInicial,
  somenteLeitura = false,
  onConfirmar,
}: DentePeriogramaPanelProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && numeroDente != null ? (
        <DentePeriogramaPanelForm
          key={`${numeroDente}-${somenteLeitura ? "ro" : "rw"}-${
            valorInicial ? "com-dados" : "vazio"
          }`}
          numeroDente={numeroDente}
          valorInicial={valorInicial}
          somenteLeitura={somenteLeitura}
          onConfirmar={onConfirmar}
          onCancelar={() => onOpenChange(false)}
        />
      ) : null}
    </Dialog>
  );
}

function DentePeriogramaPanelForm({
  numeroDente,
  valorInicial,
  somenteLeitura,
  onConfirmar,
  onCancelar,
}: {
  numeroDente: number;
  valorInicial: DentePeriogramaDTO | null;
  somenteLeitura: boolean;
  onConfirmar?: (dente: DentePeriogramaDTO) => void;
  onCancelar: () => void;
}) {
  const [rascunho, setRascunho] = useState(() =>
    montarRascunho(numeroDente, valorInicial),
  );
  const [erroFurca, setErroFurca] = useState<string | null>(null);

  const vestibular = rascunho.pontos.filter((p) => p.lado === "vestibular");
  const palatina = rascunho.pontos.filter(
    (p) => p.lado === "palatina_lingual",
  );

  function atualizarPonto(proximo: PontoSondagemDTO) {
    setRascunho((prev) => ({
      ...prev,
      pontos: prev.pontos.map((p) =>
        p.lado === proximo.lado && p.posicao === proximo.posicao
          ? proximo
          : p,
      ),
    }));
  }

  function handleFurcaChange(furca: ClassificacaoFurcaDTO | null) {
    setErroFurca(null);
    if (furca) {
      const parsed = classificacaoFurcaSchema.safeParse(furca);
      if (!parsed.success) {
        setErroFurca(
          parsed.error.issues[0]?.message ??
            "Grau inválido para o sistema escolhido.",
        );
        return;
      }
    }
    setRascunho((prev) => ({ ...prev, classificacaoFurca: furca }));
  }

  function handleConfirmar() {
    if (somenteLeitura) return;
    if (rascunho.classificacaoFurca) {
      const parsed = classificacaoFurcaSchema.safeParse(
        rascunho.classificacaoFurca,
      );
      if (!parsed.success) {
        setErroFurca(
          parsed.error.issues[0]?.message ??
            "Grau inválido para o sistema escolhido.",
        );
        return;
      }
    }
    onConfirmar?.(rascunho);
    onCancelar();
  }

  return (
    <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
      <DialogHeader>
        <div className="flex items-start gap-3">
          <IlustracaoTipoDente numeroDente={numeroDente} variante="detalhe" />
          <div className="space-y-1">
            <DialogTitle>
              Dente {numeroDente}
              {somenteLeitura ? " — somente leitura" : null}
            </DialogTitle>
            <DialogDescription>
              {somenteLeitura
                ? "Exame já registrado — dados imutáveis. Correção exige novo exame (reavaliação)."
                : "Preencha os pontos de sondagem e os campos do dente. Dados ficam na sessão até salvar o periograma."}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="mobilidade">Mobilidade (Miller)</Label>
            <Select
              value={
                rascunho.mobilidade != null
                  ? String(rascunho.mobilidade)
                  : "__none__"
              }
              disabled={somenteLeitura}
              onValueChange={(v) =>
                setRascunho((prev) => ({
                  ...prev,
                  mobilidade: v === "__none__" ? null : Number(v),
                }))
              }
            >
              <SelectTrigger id="mobilidade" className="min-h-11 w-full">
                <SelectValue placeholder="Não avaliado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Não avaliado</SelectItem>
                <SelectItem value="0">0</SelectItem>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <label className="flex min-h-11 items-center gap-2 self-end text-[13px]">
            <Checkbox
              checked={rascunho.implante === true}
              disabled={somenteLeitura}
              onCheckedChange={(checked) =>
                setRascunho((prev) => ({
                  ...prev,
                  implante: checked === true ? true : null,
                }))
              }
            />
            Implante
          </label>
        </div>

        <ClassificacaoFurcaSelector
          numeroDente={numeroDente}
          value={rascunho.classificacaoFurca}
          somenteLeitura={somenteLeitura}
          onChange={handleFurcaChange}
          erroGrau={erroFurca}
        />

        <section className="space-y-3" aria-labelledby="vestibular-titulo">
          <h3
            id="vestibular-titulo"
            className="text-sm font-semibold text-foreground"
          >
            {ROTULOS_LADO.vestibular}
          </h3>
          <div className="grid gap-3 md:grid-cols-3">
            {vestibular.map((p) => (
              <PontoSondagemInput
                key={`${p.lado}-${p.posicao}`}
                ponto={p}
                somenteLeitura={somenteLeitura}
                onChange={atualizarPonto}
              />
            ))}
          </div>
        </section>

        <section className="space-y-3" aria-labelledby="palatina-titulo">
          <h3
            id="palatina-titulo"
            className="text-sm font-semibold text-foreground"
          >
            {ROTULOS_LADO.palatina_lingual}
          </h3>
          <div className="grid gap-3 md:grid-cols-3">
            {palatina.map((p) => (
              <PontoSondagemInput
                key={`${p.lado}-${p.posicao}`}
                ponto={p}
                somenteLeitura={somenteLeitura}
                onChange={atualizarPonto}
              />
            ))}
          </div>
        </section>

        <div className="space-y-1.5">
          <Label htmlFor="nota-dente">Nota (opcional)</Label>
          <Textarea
            id="nota-dente"
            rows={3}
            disabled={somenteLeitura}
            readOnly={somenteLeitura}
            value={rascunho.nota ?? ""}
            onChange={(e) =>
              setRascunho((prev) => ({
                ...prev,
                nota: e.target.value.length > 0 ? e.target.value : null,
              }))
            }
            placeholder="Observação clínica deste dente"
          />
        </div>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          onClick={onCancelar}
        >
          {somenteLeitura ? "Fechar" : "Cancelar"}
        </Button>
        {!somenteLeitura ? (
          <Button type="button" className="min-h-11" onClick={handleConfirmar}>
            Incluir na sessão
          </Button>
        ) : null}
      </DialogFooter>
    </DialogContent>
  );
}
