import { Plano } from "@/core/assinatura/domain/Plano";
import type { PlanoRepositoryPort } from "@/core/assinatura/application/ports/PlanoRepositoryPort";
import { PLANOS_MARKETING } from "@/lib/cadastro/planos";

/** Garante que os planos comerciais existam no banco (upsert idempotente). */
export async function garantirPlanosCatalogo(
  planoRepo: PlanoRepositoryPort,
): Promise<void> {
  for (const item of PLANOS_MARKETING) {
    const existente = await planoRepo.buscarPorId(item.id);
    if (existente) continue;
    await planoRepo.salvar(
      Plano.criar({
        id: item.id,
        nome: item.nome,
        valorMensal: item.valorMensalCatalogo,
      }),
    );
  }
}
