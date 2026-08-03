import { AgendaDashboardPanel } from "@/components/agenda/AgendaDashboardPanel";
import { BlocoErro } from "@/components/dashboard/BlocoErro";
import { carregarAgendamentosDoPeriodo } from "@/lib/agenda/carregar-agendamentos";
import { carregarOpcoesAgenda } from "@/lib/agenda/carregar-opcoes";
import { permissoesAgendaParaPapel } from "@/lib/agenda/permissoes";
import { requireSessaoClinica } from "@/lib/dashboard/obter-sessao-clinica";
import { periodoDoDia } from "@/lib/periodo-dia";

export async function AgendaDoDiaSection() {
  const sessao = await requireSessaoClinica();
  const { dataInicio, dataFim } = periodoDoDia();

  let agendamentos;
  let opcoes;
  try {
    [agendamentos, opcoes] = await Promise.all([
      carregarAgendamentosDoPeriodo({ dataInicio, dataFim }),
      carregarOpcoesAgenda(),
    ]);
  } catch (error) {
    console.error("[dashboard] AgendaDoDiaSection", error);
    return (
      <BlocoErro
        title="Agenda do dia"
        mensagem={
          error instanceof Error
            ? error.message
            : "Não foi possível carregar a agenda do dia."
        }
      />
    );
  }

  return (
    <AgendaDashboardPanel
      iniciais={agendamentos}
      profissionais={opcoes.profissionais}
      pacientes={opcoes.pacientes}
      procedimentos={opcoes.procedimentos}
      permissoes={permissoesAgendaParaPapel(sessao.papel)}
      profissionalIdSessao={sessao.profissionalId}
    />
  );
}
