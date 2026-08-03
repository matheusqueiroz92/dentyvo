"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { formatarCpfCompleto } from "@/lib/pacientes/cpf";
import {
  calcularIdade,
  formatarDataNascimento,
  formatarTelefoneBr,
} from "@/lib/pacientes/formatacao";
import type { PacienteDTO } from "@/lib/pacientes/types";

type PacienteDetalheHeaderProps = {
  paciente: PacienteDTO;
};

export function PacienteDetalheHeader({ paciente }: PacienteDetalheHeaderProps) {
  const idade = calcularIdade(paciente.dataNascimentoIso);

  return (
    <header className="space-y-4">
      <Button asChild variant="ghost" size="sm" className="min-h-11 px-2 sm:min-h-8">
        <Link href="/pacientes">
          <ArrowLeft aria-hidden />
          Pacientes
        </Link>
      </Button>

      <div className="space-y-2">
        <h1 className="text-3xl leading-[38px] font-bold tracking-tight text-foreground">
          {paciente.nome}
        </h1>
        <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <div>
            <dt className="sr-only">CPF</dt>
            <dd className="tabular-nums">
              CPF {formatarCpfCompleto(paciente.cpf)}
            </dd>
          </div>
          <div>
            <dt className="sr-only">Telefone</dt>
            <dd className="tabular-nums">
              {formatarTelefoneBr(paciente.telefone)}
            </dd>
          </div>
          <div>
            <dt className="sr-only">Data de nascimento</dt>
            <dd className="tabular-nums">
              {formatarDataNascimento(paciente.dataNascimentoIso)}
              <span className="text-muted-foreground">
                {" "}
                · {idade} {idade === 1 ? "ano" : "anos"}
              </span>
            </dd>
          </div>
        </dl>
      </div>
    </header>
  );
}
