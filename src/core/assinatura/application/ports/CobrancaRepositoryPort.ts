import type { Cobranca } from "../../domain/Cobranca";

export interface CobrancaRepositoryPort {
  salvar(cobranca: Cobranca): Promise<void>;
  buscarPorId(id: string): Promise<Cobranca | null>;
  buscarPorGatewayCobrancaId(
    gatewayCobrancaId: string,
  ): Promise<Cobranca | null>;
  listarPorAssinaturaId(assinaturaId: string): Promise<Cobranca[]>;
}
