import type { Papel } from "@/core/auth/domain/Papel";
import { seedProntuarioExistente } from "@/core/prontuario/application/use-cases/helpers-test";

import { FakeAnamneseRepository } from "../test-doubles/fakes";

export async function seedContextoAnamnese(papel: Papel = "dentista") {
  const ctx = await seedProntuarioExistente(papel);
  const anamneseRepo = new FakeAnamneseRepository();
  return { ...ctx, anamneseRepo };
}
