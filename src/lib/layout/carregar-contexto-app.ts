import { cache } from "react";

import { createAuthModule } from "@/core/auth/infra/create-auth-module";
import { requireSessaoClinica } from "@/lib/dashboard/obter-sessao-clinica";

import type { ContextoAppLayout } from "./types";

/** Dados de layout autenticado (clínica + usuário da sessão). */
export const carregarContextoApp = cache(
  async (): Promise<ContextoAppLayout> => {
    const sessao = await requireSessaoClinica();
    const auth = createAuthModule();

    const [clinica, profissional] = await Promise.all([
      auth.clinicaRepo.buscarPorId(sessao.clinicaId),
      auth.profissionalRepo.buscarPorId(
        sessao.clinicaId,
        sessao.profissionalId,
      ),
    ]);

    return {
      clinicaId: sessao.clinicaId,
      clinicaNome: clinica?.nome ?? "Clínica",
      usuario: {
        id: sessao.usuarioId,
        nome: profissional?.nome ?? "Usuário",
        papel: sessao.papel,
        profissionalId: sessao.profissionalId,
      },
    };
  },
);
