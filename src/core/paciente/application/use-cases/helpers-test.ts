import { Profissional } from "@/core/auth/domain/Profissional";
import type { Papel } from "@/core/auth/domain/Papel";
import { FakeProfissionalRepository } from "@/core/auth/application/test-doubles/fakes";

import { FakePacienteRepository } from "../test-doubles/fakes";

export async function seedSolicitante(papel: Papel) {
  const profissionalRepo = new FakeProfissionalRepository();
  const pacienteRepo = new FakePacienteRepository();

  const profissional = Profissional.criar({
    id: `prof-${papel}`,
    clinicaId: "clinica-1",
    usuarioId: `user-${papel}`,
    nome: `Solicitante ${papel}`,
    papel,
    cro: papel === "dentista" ? "12345" : null,
  });
  await profissionalRepo.salvar(profissional);

  return {
    clinicaId: "clinica-1",
    solicitadoPorUsuarioId: profissional.usuarioId,
    profissional,
    profissionalRepo,
    pacienteRepo,
  };
}
