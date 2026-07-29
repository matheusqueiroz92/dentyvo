import type { Assinatura } from "../../domain/Assinatura";

export interface AssinaturaRepositoryPort {
  salvar(assinatura: Assinatura): Promise<void>;
  buscarPorId(id: string): Promise<Assinatura | null>;
  buscarPorClinicaId(clinicaId: string): Promise<Assinatura | null>;
  buscarPorGatewayAssinaturaId(
    gatewayAssinaturaId: string,
  ): Promise<Assinatura | null>;

  /**
   * Assinaturas com cópia promocional, sem `avisoAumentoPrecoEnviadoEm`,
   * cujo `precoPromocionalAte` está a ≤ `antecedenciaDias` de `agora`
   * (spec 012 — job de aviso).
   */
  listarComAvisoAumentoPrecoPendente(input: {
    agora: Date;
    antecedenciaDias: number;
    limite?: number;
  }): Promise<Assinatura[]>;
}
