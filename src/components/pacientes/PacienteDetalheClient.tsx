"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

import { ProntuarioTab } from "@/components/prontuario";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Papel } from "@/core/auth/domain/Papel";
import { abaDetalhePacienteDaQuery } from "@/lib/pacientes/aba";
import { formatarCpfCompleto } from "@/lib/pacientes/cpf";
import {
  formatarDataNascimento,
  formatarTelefoneBr,
} from "@/lib/pacientes/formatacao";
import type { PacienteDTO } from "@/lib/pacientes/types";

import { EditarPacienteModal } from "./EditarPacienteModal";
import { PacienteDetalheHeader } from "./PacienteDetalheHeader";

type PacienteDetalheClientProps = {
  paciente: PacienteDTO;
  papel: Papel;
};

export function PacienteDetalheClient({
  paciente: pacienteInicial,
  papel,
}: PacienteDetalheClientProps) {
  const searchParams = useSearchParams();
  const [paciente, setPaciente] = useState(pacienteInicial);
  const [editarOpen, setEditarOpen] = useState(false);
  const [aba, setAba] = useState(() =>
    abaDetalhePacienteDaQuery(searchParams.get("aba")),
  );
  const podeAcessarClinico = papel === "admin" || papel === "dentista";
  /** Specs 006/006b: receituário e atestado só para dentista (admin precisa CRO). */
  const podeReceituario = papel === "dentista";
  /** Spec 015: orçamento comercial — admin, dentista e recepção. */
  const podeOrcamento =
    papel === "admin" || papel === "dentista" || papel === "recepcao";

  return (
    <main className="flex flex-col gap-6">
      <PacienteDetalheHeader paciente={paciente} />

      <Tabs value={aba} onValueChange={setAba}>
        <TabsList variant="line">
          <TabsTrigger value="dados" className="min-h-11 px-3 sm:min-h-8">
            Dados gerais
          </TabsTrigger>
          <TabsTrigger value="historico" className="min-h-11 px-3 sm:min-h-8">
            Histórico
          </TabsTrigger>
          <TabsTrigger value="prontuario" className="min-h-11 px-3 sm:min-h-8">
            Prontuário
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="mt-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-semibold text-foreground">
              Dados do paciente
            </h2>
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={() => setEditarOpen(true)}
            >
              Editar
            </Button>
          </div>

          <dl className="grid gap-4 sm:grid-cols-2">
            <Campo label="Nome" valor={paciente.nome} />
            <Campo
              label="CPF"
              valor={formatarCpfCompleto(paciente.cpf)}
              tabular
            />
            <Campo
              label="Telefone"
              valor={formatarTelefoneBr(paciente.telefone)}
              tabular
            />
            <Campo
              label="Data de nascimento"
              valor={formatarDataNascimento(paciente.dataNascimentoIso)}
              tabular
            />
            <Campo
              label="Contato de emergência"
              valor={paciente.contatoEmergencia ?? "—"}
            />
          </dl>
        </TabsContent>

        <TabsContent value="historico" className="mt-4">
          <PlaceholderAba
            titulo="Histórico"
            descricao="A listagem de consultas por paciente estará disponível quando o backend expuser agendamentos filtrados por paciente. Em construção."
          />
        </TabsContent>

        <TabsContent value="prontuario" className="mt-4">
          {aba === "prontuario" ? (
            <ProntuarioTab
              pacienteId={paciente.id}
              pacienteNome={paciente.nome}
              dataNascimentoIso={paciente.dataNascimentoIso}
              podeAcessarClinico={podeAcessarClinico}
              podeReceituario={podeReceituario}
              podeOrcamento={podeOrcamento}
            />
          ) : null}
        </TabsContent>
      </Tabs>

      <EditarPacienteModal
        open={editarOpen}
        onOpenChange={setEditarOpen}
        paciente={paciente}
        onAtualizado={setPaciente}
      />
    </main>
  );
}

function Campo({
  label,
  valor,
  tabular,
}: {
  label: string;
  valor: string;
  tabular?: boolean;
}) {
  return (
    <div className="space-y-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={
          tabular
            ? "text-sm tabular-nums text-foreground"
            : "text-sm text-foreground"
        }
      >
        {valor}
      </dd>
    </div>
  );
}

function PlaceholderAba({
  titulo,
  descricao,
}: {
  titulo: string;
  descricao: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center">
      <p className="text-sm font-medium text-foreground">{titulo}</p>
      <p className="mt-1 text-[13px] leading-5 text-muted-foreground">
        {descricao}
      </p>
    </div>
  );
}
