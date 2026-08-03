import { Suspense } from "react";

import { AgendaPageClient } from "@/components/agenda/AgendaPageClient";
import { Skeleton } from "@/components/ui/skeleton";
import { carregarAgendamentosDoPeriodo } from "@/lib/agenda/carregar-agendamentos";
import { carregarOpcoesAgenda } from "@/lib/agenda/carregar-opcoes";
import { periodoParaModo } from "@/lib/agenda/periodo";
import { permissoesAgendaParaPapel } from "@/lib/agenda/permissoes";
import { requireSessaoClinica } from "@/lib/dashboard/obter-sessao-clinica";

export const metadata = {
  title: "Agenda — Dentyvo",
};

async function AgendaConteudo() {
  const sessao = await requireSessaoClinica();
  const modo = "dia" as const;
  const referencia = new Date();
  const { dataInicio, dataFim } = periodoParaModo(modo, referencia);

  const [agendamentos, opcoes] = await Promise.all([
    carregarAgendamentosDoPeriodo({ dataInicio, dataFim }),
    carregarOpcoesAgenda(),
  ]);

  return (
    <AgendaPageClient
      contexto={{
        clinicaId: sessao.clinicaId,
        usuarioId: sessao.usuarioId,
        papel: sessao.papel,
        profissionalId: sessao.profissionalId,
        permissoes: permissoesAgendaParaPapel(sessao.papel),
      }}
      iniciais={agendamentos}
      dataInicioIso={dataInicio.toISOString()}
      dataFimIso={dataFim.toISOString()}
      modoInicial={modo}
      referenciaIso={referencia.toISOString()}
      profissionais={opcoes.profissionais}
      pacientes={opcoes.pacientes}
      procedimentos={opcoes.procedimentos}
    />
  );
}

export default function AgendaPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-96 w-full" />
        </div>
      }
    >
      <AgendaConteudo />
    </Suspense>
  );
}
