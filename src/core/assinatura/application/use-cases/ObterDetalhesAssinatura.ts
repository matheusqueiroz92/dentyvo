import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";

import type { DetalhesAssinatura } from "../../domain/DetalhesAssinatura";
import {
  montarHistoricoCobranca,
  resolverLinkRegularizacao,
} from "../../domain/DetalhesAssinatura";
import { AssinaturaNaoEncontradaError } from "../../domain/errors";
import type { AssinaturaRepositoryPort } from "../ports/AssinaturaRepositoryPort";
import type { CobrancaRepositoryPort } from "../ports/CobrancaRepositoryPort";
import type { PlanoRepositoryPort } from "../ports/PlanoRepositoryPort";
import type { VagaPromocionalRepositoryPort } from "../ports/VagaPromocionalRepositoryPort";
import { autorizarClinica, obterSolicitanteNaClinica } from "./helpers";
import type { ResolverValorCobrancaAssinatura } from "./ResolverValorCobrancaAssinatura";

export type ObterDetalhesAssinaturaInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
  /** Default `new Date()` — janela promocional / valor efetivo. */
  agora?: Date;
};

/**
 * Leitura agregada do painel da clínica (spec 010 + 012).
 *
 * **Não** persiste, **não** chama `AssinaturaGatewayPort`, **não** muta
 * `Assinatura` / `Cobranca` / vaga. Histórico vem de
 * `CobrancaRepositoryPort` local (P3). Sem assinatura →
 * `AssinaturaNaoEncontradaError` (P7).
 *
 * RBAC: `obter_detalhes_assinatura` (só `admin`), via `shared/autorizacao`.
 */
export class ObterDetalhesAssinatura {
  constructor(
    private readonly assinaturaRepo: AssinaturaRepositoryPort,
    private readonly planoRepo: PlanoRepositoryPort,
    private readonly cobrancaRepo: CobrancaRepositoryPort,
    private readonly vagaRepo: VagaPromocionalRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
    private readonly resolverValor: ResolverValorCobrancaAssinatura,
  ) {}

  async executar(
    input: ObterDetalhesAssinaturaInput,
  ): Promise<DetalhesAssinatura> {
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizarClinica(solicitante, "obter_detalhes_assinatura");

    const assinatura = await this.assinaturaRepo.buscarPorClinicaId(
      input.clinicaId,
    );
    if (!assinatura) {
      throw new AssinaturaNaoEncontradaError(input.clinicaId);
    }

    const agora = input.agora ?? new Date();
    const [cobrancas, vaga] = await Promise.all([
      this.cobrancaRepo.listarPorAssinaturaId(assinatura.id),
      this.vagaRepo.buscarPorClinica(input.clinicaId),
    ]);

    const plano = assinatura.planoId
      ? await this.planoRepo.buscarPorId(assinatura.planoId)
      : null;

    let valorEfetivoCentavos: number | null = null;
    let origemValor: DetalhesAssinatura["origemValor"] = null;
    if (assinatura.planoId) {
      const resolvido = await this.resolverValor.executar({
        assinaturaId: assinatura.id,
        agora,
      });
      valorEfetivoCentavos = resolvido.valorCentavos;
      origemValor = resolvido.origem;
    }

    return {
      plano: plano
        ? { nome: plano.nome, valorMensal: plano.valorMensal }
        : null,
      status: assinatura.status,
      dataProximaCobranca: assinatura.dataProximaCobranca,
      historicoCobranca: montarHistoricoCobranca(cobrancas),
      precoPromocionalAte: assinatura.precoPromocionalAte,
      migradaParaPrecoCheioEm: assinatura.migradaParaPrecoCheioEm,
      valorEfetivoCentavos,
      origemValor,
      vagaPromocional: vaga ? { posicao: vaga.posicao } : null,
      linkRegularizacao: resolverLinkRegularizacao(cobrancas),
    };
  }
}
