import type { Assinatura } from "../../domain/Assinatura";

export interface AssinaturaRepositoryPort {
  salvar(assinatura: Assinatura): Promise<void>;
  buscarPorId(id: string): Promise<Assinatura | null>;
  buscarPorClinicaId(clinicaId: string): Promise<Assinatura | null>;
  buscarPorGatewayAssinaturaId(
    gatewayAssinaturaId: string,
  ): Promise<Assinatura | null>;
}
