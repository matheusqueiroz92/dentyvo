import type { Convite } from "../../domain/Convite";

export interface ConviteRepositoryPort {
  salvar(convite: Convite): Promise<void>;
  buscarPorToken(token: string): Promise<Convite | null>;
  buscarPendentePorEmailEClinica(
    clinicaId: string,
    email: string,
  ): Promise<Convite | null>;
}
