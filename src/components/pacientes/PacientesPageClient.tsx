"use client";

import { UserPlus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { listarPacientesAction } from "@/actions/paciente";
import { Button } from "@/components/ui/button";
import type { PacienteDTO } from "@/lib/pacientes/types";

import { NovoPacienteModal } from "./NovoPacienteModal";
import { PacientesTable } from "./PacientesTable";

type PacientesPageClientProps = {
  iniciais: PacienteDTO[];
};

export function PacientesPageClient({ iniciais }: PacientesPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const novoViaQuery = searchParams.get("novo") === "1";

  const [listaServidor, setListaServidor] = useState<PacienteDTO[] | null>(
    null,
  );
  const [criadosLocalmente, setCriadosLocalmente] = useState<PacienteDTO[]>(
    [],
  );
  const [novoManual, setNovoManual] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const novoOpen = novoViaQuery || novoManual;

  const pacientes = useMemo(() => {
    const base = listaServidor ?? iniciais;
    const ids = new Set(base.map((p) => p.id));
    const extras = criadosLocalmente.filter((p) => !ids.has(p.id));
    return [...extras, ...base];
  }, [iniciais, listaServidor, criadosLocalmente]);

  const limparQueryNovo = useCallback(() => {
    if (searchParams.get("novo") !== "1") return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("novo");
    const qs = params.toString();
    router.replace(qs ? `/pacientes?${qs}` : "/pacientes", { scroll: false });
  }, [router, searchParams]);

  function handleNovoOpenChange(open: boolean) {
    if (open) {
      setNovoManual(true);
      return;
    }
    setNovoManual(false);
    limparQueryNovo();
  }

  const recarregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    const result = await listarPacientesAction();
    setCarregando(false);
    if (result.serverError || !result.data) {
      setErro(
        result.serverError?.mensagem ??
          "Não foi possível carregar os pacientes.",
      );
      return;
    }
    setListaServidor(result.data);
    setCriadosLocalmente([]);
  }, []);

  function handleCriado(paciente: PacienteDTO) {
    setCriadosLocalmente((prev) => {
      if (prev.some((p) => p.id === paciente.id)) return prev;
      return [paciente, ...prev];
    });
  }

  return (
    <main className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl leading-[38px] font-bold tracking-tight text-foreground">
            Pacientes
          </h1>
          <p className="mt-1 text-sm leading-[22px] text-muted-foreground">
            Cadastro e busca de pacientes da clínica.
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          className="min-h-11"
          onClick={() => setNovoManual(true)}
        >
          <UserPlus aria-hidden />
          Novo paciente
        </Button>
      </header>

      <PacientesTable
        pacientes={pacientes}
        carregando={carregando}
        erro={erro}
        onRetry={recarregar}
        onNovo={() => setNovoManual(true)}
        listaVaziaSemFiltro
      />

      <NovoPacienteModal
        open={novoOpen}
        onOpenChange={handleNovoOpenChange}
        onCriado={handleCriado}
      />
    </main>
  );
}
