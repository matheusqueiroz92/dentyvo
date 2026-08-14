"use client";

import { useEffect, useState, useTransition } from "react";

import { consultarClinicaAction } from "@/actions/configuracoes-clinica";
import { EditarDadosClinicaModal } from "@/components/configuracoes/EditarDadosClinicaModal";
import { SeletorTemaClinica } from "@/components/configuracoes/SeletorTemaClinica";
import { StatusClinicaBadge } from "@/components/configuracoes/StatusClinicaBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatarDocumentoFiscal,
  rotuloTipoDocumento,
} from "@/lib/configuracoes/formatar-documento";
import type { ClinicaGeralDTO } from "@/lib/configuracoes/types";

export function GeralConfigTab() {
  const [clinica, setClinica] = useState<ClinicaGeralDTO | null>(null);
  const [papel, setPapel] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [editarAberto, setEditarAberto] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelado = false;
    startTransition(async () => {
      const result = await consultarClinicaAction();
      if (cancelado) return;
      if (result.serverError) {
        setErro(result.serverError.mensagem);
        return;
      }
      if (!result.data) {
        setErro("Não foi possível carregar os dados da clínica.");
        return;
      }
      setPapel(result.data.papel);
      setClinica(result.data.clinica);
    });
    return () => {
      cancelado = true;
    };
  }, [startTransition]);

  if (erro && !clinica) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Não foi possível carregar os dados da clínica</AlertTitle>
        <AlertDescription>{erro}</AlertDescription>
      </Alert>
    );
  }

  if (!clinica || pending) {
    return (
      <div
        className="space-y-3"
        aria-busy="true"
        aria-label="Carregando dados da clínica"
      >
        <Skeleton className="h-11 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (papel !== "admin") {
    return (
      <p className="text-sm text-muted-foreground">
        Apenas administradores podem ver e editar os dados cadastrais da
        clínica.
      </p>
    );
  }

  const rotuloDocumento = rotuloTipoDocumento(clinica.documento.tipo);
  const documentoFormatado = formatarDocumentoFiscal(
    clinica.documento.tipo,
    clinica.documento.valor,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Dados da clínica</h2>
          <p className="text-sm text-muted-foreground">
            Informações cadastrais usadas em receituário, atestado e
            agendamento.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          onClick={() => setEditarAberto(true)}
        >
          Editar
        </Button>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <Campo label="Nome" valor={clinica.nome} />
        <Campo label="Endereço" valor={clinica.endereco} />
        <div className="space-y-1">
          <dt className="text-xs text-muted-foreground">{rotuloDocumento}</dt>
          <dd className="text-sm tabular-nums text-foreground">
            {documentoFormatado}
          </dd>
          <p className="text-[13px] leading-5 text-muted-foreground">
            Documento fiscal imutável — identidade da clínica na plataforma.
            Correção exige suporte.
          </p>
        </div>
        <div className="space-y-1">
          <dt className="text-xs text-muted-foreground">Status</dt>
          <dd>
            <StatusClinicaBadge status={clinica.status} />
          </dd>
        </div>
      </dl>

      <Separator />

      <SeletorTemaClinica temaInicial={clinica.tema} />

      <EditarDadosClinicaModal
        open={editarAberto}
        onOpenChange={setEditarAberto}
        clinica={clinica}
        onAtualizada={setClinica}
      />
    </div>
  );
}

function Campo({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{valor}</dd>
    </div>
  );
}
