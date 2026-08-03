import { BuscarPacientePorId } from "@/core/paciente/application/use-cases/BuscarPacientePorId";
import { ListarPacientes } from "@/core/paciente/application/use-cases/ListarPacientes";
import { createPacienteModule } from "@/core/paciente/infra/create-paciente-module";
import { requireSessaoClinica } from "@/lib/dashboard/obter-sessao-clinica";

import { pacienteParaDto } from "./mapear";
import type { PacienteDTO } from "./types";

export async function carregarListaPacientes(): Promise<PacienteDTO[]> {
  const sessao = await requireSessaoClinica();
  const mod = createPacienteModule();
  const lista = await new ListarPacientes(
    mod.pacienteRepo,
    mod.profissionalRepo,
  ).executar({
    clinicaId: sessao.clinicaId,
    solicitadoPorUsuarioId: sessao.usuarioId,
  });
  return lista.map(pacienteParaDto);
}

export async function carregarPacientePorId(
  pacienteId: string,
): Promise<PacienteDTO | null> {
  const sessao = await requireSessaoClinica();
  const mod = createPacienteModule();
  try {
    const paciente = await new BuscarPacientePorId(
      mod.pacienteRepo,
      mod.profissionalRepo,
    ).executar({
      clinicaId: sessao.clinicaId,
      solicitadoPorUsuarioId: sessao.usuarioId,
      pacienteId,
    });
    return pacienteParaDto(paciente);
  } catch (erro) {
    if (
      erro instanceof Error &&
      "nome" in erro &&
      (erro as { nome: string }).nome === "PacienteNaoEncontradoError"
    ) {
      return null;
    }
    throw erro;
  }
}
