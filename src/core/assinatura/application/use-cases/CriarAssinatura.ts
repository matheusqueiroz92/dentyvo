import type { ClinicaRepositoryPort } from "@/core/auth/application/ports/ClinicaRepositoryPort";
import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";
import { DadosInvalidosError } from "@/core/shared/errors";

import type { Assinatura } from "../../domain/Assinatura";
import { assertMetodoPagamentoMvp } from "../../domain/MetodoPagamento";
import type { MetodoPagamentoMvp } from "../../domain/MetodoPagamento";
import {
  AssinaturaNaoEncontradaError,
  PlanoNaoEncontradoError,
} from "../../domain/errors";
import type { AssinaturaGatewayPort } from "../ports/AssinaturaGatewayPort";
import type { AssinaturaRepositoryPort } from "../ports/AssinaturaRepositoryPort";
import type { PlanoRepositoryPort } from "../ports/PlanoRepositoryPort";
import { autorizarClinica, obterSolicitanteNaClinica } from "./helpers";

export type CriarAssinaturaInput = {
  clinicaId: string;
  planoId: string;
  /** MVP: apenas `pix` | `boleto` — `cartao` rejeitado no domínio. */
  metodoPagamento: MetodoPagamentoMvp | string;
  solicitadoPorUsuarioId: string;
};

/**
 * Escolhe plano e cria assinatura recorrente mensal no gateway (spec 010).
 *
 * Assinatura: `CriarAssinatura(clinicaId, planoId, metodoPagamento) → Assinatura`
 */
export class CriarAssinatura {
  constructor(
    private readonly assinaturaRepo: AssinaturaRepositoryPort,
    private readonly planoRepo: PlanoRepositoryPort,
    private readonly gateway: AssinaturaGatewayPort,
    private readonly clinicaRepo: ClinicaRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
  ) {}

  async executar(input: CriarAssinaturaInput): Promise<Assinatura> {
    const metodo = assertMetodoPagamentoMvp(input.metodoPagamento);

    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizarClinica(solicitante, "criar_assinatura");

    const plano = await this.planoRepo.buscarPorId(input.planoId);
    if (!plano) {
      throw new PlanoNaoEncontradoError(input.planoId);
    }

    const clinica = await this.clinicaRepo.buscarPorId(input.clinicaId);
    if (!clinica) {
      throw new DadosInvalidosError("Clínica não encontrada.");
    }

    const assinatura = await this.assinaturaRepo.buscarPorClinicaId(
      input.clinicaId,
    );
    if (!assinatura) {
      throw new AssinaturaNaoEncontradaError(input.clinicaId);
    }

    const cliente = await this.gateway.criarCliente({
      referenciaExterna: clinica.id,
      nome: clinica.nome,
      email: `clinica-${clinica.id}@assinatura.dentyvo.local`,
      cpfCnpj: clinica.documento.valor,
    });

    const proximoVencimento = new Date();
    proximoVencimento.setUTCDate(proximoVencimento.getUTCDate() + 1);

    const criadaNoGateway = await this.gateway.criarAssinatura({
      gatewayClienteId: cliente.gatewayClienteId,
      valorMensal: plano.valorMensal,
      metodo,
      descricao: `Plano ${plano.nome}`,
      proximoVencimento,
    });

    const atualizada = assinatura.vincularPlanoNoGateway({
      planoId: plano.id,
      gatewayClienteId: cliente.gatewayClienteId,
      gatewayAssinaturaId: criadaNoGateway.gatewayAssinaturaId,
      dataProximaCobranca: criadaNoGateway.dataProximaCobranca,
    });
    await this.assinaturaRepo.salvar(atualizada);
    return atualizada;
  }
}
