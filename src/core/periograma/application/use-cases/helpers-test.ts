import { FakeProfissionalRepository } from "@/core/auth/application/test-doubles/fakes";
import type { Papel } from "@/core/auth/domain/Papel";
import { Profissional } from "@/core/auth/domain/Profissional";
import { FakeProntuarioRepository } from "@/core/prontuario/application/test-doubles/fakes";
import { Prontuario } from "@/core/prontuario/domain/Prontuario";

import type { DentePeriogramaCriarInput } from "../../domain/DentePeriograma";
import { FakePeriogramaRepository } from "../test-doubles/fakes";

/**
 * Seed multi-tenant com profissional, prontuário e repositório de periograma.
 * Reaproveita fakes de 001/003 — não redefine ports alheias.
 */
export async function seedContextoPeriograma(papel: Papel = "dentista") {
  const profissionalRepo = new FakeProfissionalRepository();
  const prontuarioRepo = new FakeProntuarioRepository();
  const periogramaRepo = new FakePeriogramaRepository();

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
    periogramaRepo,
    prontuario,
  };
}

/** Dente molar permanente com furca Hamp e poucos pontos (preenchimento parcial). */
export function denteMolarParcial(
  overrides?: Partial<DentePeriogramaCriarInput>,
): DentePeriogramaCriarInput {
  return {
    numeroDente: 16,
    mobilidade: 1,
    implante: false,
    classificacaoFurca: { sistema: "hamp", grau: 2 },
    nota: null,
    pontos: [
      {
        lado: "vestibular",
        posicao: "mesial",
        margemGengival: -1,
        profundidadeSondagem: 4,
        placa: true,
        sangramentoSondagem: null,
      },
      {
        lado: "palatina_lingual",
        posicao: "central",
        margemGengival: null,
        profundidadeSondagem: 3,
      },
    ],
    ...overrides,
  };
}
