import { FakeProfissionalRepository } from "@/core/auth/application/test-doubles/fakes";
import type { Papel } from "@/core/auth/domain/Papel";
import { Profissional } from "@/core/auth/domain/Profissional";
import { FakeProntuarioRepository } from "@/core/prontuario/application/test-doubles/fakes";
import { Prontuario } from "@/core/prontuario/domain/Prontuario";

import { EventoOdontograma } from "../../domain/EventoOdontograma";
import { FakeOdontogramaRepository } from "../test-doubles/fakes";

/**
 * Seed multi-tenant com profissional, prontuário e repositório de odontograma.
 * Reaproveita fakes de 001/003 — não redefine ports alheias.
 */
export async function seedContextoOdontograma(papel: Papel = "dentista") {
  const profissionalRepo = new FakeProfissionalRepository();
  const prontuarioRepo = new FakeProntuarioRepository();
  const odontogramaRepo = new FakeOdontogramaRepository();

  const profissional = Profissional.criar({
    id: `prof-${papel}`,
    clinicaId: "clinica-1",
    usuarioId: `user-${papel}`,
    nome: `Solicitante ${papel}`,
    papel,
    cro: papel === "dentista" ? "12345" : null,
  });
  await profissionalRepo.salvar(profissional);

  const prontuario = Prontuario.criar({
    id: "pront-1",
    clinicaId: "clinica-1",
    pacienteId: "pac-1",
  });
  await prontuarioRepo.salvar(prontuario);

  return {
    clinicaId: "clinica-1",
    solicitadoPorUsuarioId: profissional.usuarioId,
    profissional,
    profissionalRepo,
    prontuarioRepo,
    odontogramaRepo,
    prontuario,
  };
}

/** Histórico: dente 26 ausente em consulta anterior (já persistido). */
export function seedDenteAusenteConsultaAnterior(
  odontogramaRepo: FakeOdontogramaRepository,
  opts?: { clinicaId?: string; prontuarioId?: string; profissionalId?: string },
): EventoOdontograma {
  const evento = EventoOdontograma.reconstituir({
    id: "ev-ausente-anterior",
    clinicaId: opts?.clinicaId ?? "clinica-1",
    prontuarioId: opts?.prontuarioId ?? "pront-1",
    numeroDente: 26,
    nivel: "dente",
    face: null,
    estadoNovo: "ausente_extraido",
    procedimentoId: null,
    registradoEm: new Date("2026-01-01T10:00:00.000Z"),
    profissionalId: opts?.profissionalId ?? "prof-dentista",
    sequencia: 1,
  });
  odontogramaRepo.seed([evento]);
  return evento;
}
