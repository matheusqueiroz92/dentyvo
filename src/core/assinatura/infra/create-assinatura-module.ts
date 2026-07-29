import { DrizzleUsuarioPlataformaRepository } from "@/core/admin-plataforma/infra/adapters";
import {
  DrizzleClinicaRepository,
  DrizzleProfissionalRepository,
} from "@/core/auth/infra/adapters";
import { DrizzleAuditoriaLogPort } from "@/core/prontuario/infra/adapters";
import { db } from "@/db";

import {
  AplicarPrecoPromocionalNaAssinatura,
  ConcederAcessoManual,
  CriarAssinatura,
  EnviarAvisoAumentoPreco,
  IniciarTrial,
  MigrarPrecoPosPromocao,
  ProcessarAvisosAumentoPrecoPendentes,
  ProcessarWebhookPagamento,
  ReservarVagaPromocional,
  ResolverValorCobrancaAssinatura,
  VerificarAcessoAtivo,
} from "../application/use-cases";
import {
  AsaasGatewayAdapter,
  AsaasWebhookAdapter,
  DrizzleAssinaturaRepository,
  DrizzleCobrancaRepository,
  DrizzleEventoWebhookProcessadoAdapter,
  DrizzlePlanoRepository,
  DrizzleVagaPromocionalRepository,
} from "./adapters";

export type AssinaturaModuleConfig = {
  asaasApiKey: string;
  asaasWebhookToken: string;
  asaasApiUrl?: string;
};

/**
 * Composition root do módulo assinatura (spec 010 + 012).
 *
 * TODO (012): registrar `ProcessarAvisosAumentoPrecoPendentes` em
 * **Vercel Cron** (`vercel.json` → `crons`), rota protegida por segredo —
 * padrão de `specs/01-architecture.md`. Não implementar o cron nesta etapa.
 */
export function createAssinaturaModule(config: AssinaturaModuleConfig) {
  const assinaturaRepo = new DrizzleAssinaturaRepository(db);
  const cobrancaRepo = new DrizzleCobrancaRepository(db);
  const planoRepo = new DrizzlePlanoRepository(db);
  const vagaRepo = new DrizzleVagaPromocionalRepository(db);
  const eventosProcessados = new DrizzleEventoWebhookProcessadoAdapter(db);
  const clinicaRepo = new DrizzleClinicaRepository(db);
  const profissionalRepo = new DrizzleProfissionalRepository(db);
  const usuarioPlataformaRepo = new DrizzleUsuarioPlataformaRepository(db);
  const auditoria = new DrizzleAuditoriaLogPort(db);

  const gateway = new AsaasGatewayAdapter({
    apiKey: config.asaasApiKey,
    baseUrl: config.asaasApiUrl,
  });
  const webhook = new AsaasWebhookAdapter({
    webhookToken: config.asaasWebhookToken,
  });

  const reservarVagaPromocional = new ReservarVagaPromocional(
    vagaRepo,
    planoRepo,
  );
  const aplicarPrecoPromocional = new AplicarPrecoPromocionalNaAssinatura(
    assinaturaRepo,
    planoRepo,
  );

  return {
    assinaturaRepo,
    cobrancaRepo,
    planoRepo,
    vagaRepo,
    gateway,
    webhook,
    iniciarTrial: new IniciarTrial(assinaturaRepo),
    criarAssinatura: new CriarAssinatura(
      assinaturaRepo,
      planoRepo,
      gateway,
      clinicaRepo,
      profissionalRepo,
      vagaRepo,
    ),
    reservarVagaPromocional,
    aplicarPrecoPromocional,
    resolverValorCobrancaAssinatura: new ResolverValorCobrancaAssinatura(
      assinaturaRepo,
      planoRepo,
    ),
    migrarPrecoPosPromocao: new MigrarPrecoPosPromocao(
      assinaturaRepo,
      planoRepo,
      gateway,
    ),
    processarWebhookPagamento: new ProcessarWebhookPagamento(
      assinaturaRepo,
      cobrancaRepo,
      eventosProcessados,
    ),
    concederAcessoManual: new ConcederAcessoManual(
      assinaturaRepo,
      usuarioPlataformaRepo,
      auditoria,
    ),
    verificarAcessoAtivo: new VerificarAcessoAtivo(assinaturaRepo),
    /**
     * Requer `EnviarAvisoAumentoPreco` já montado com a port 011.
     * O cron (Vercel) deve chamar o retorno deste factory.
     */
    criarProcessarAvisosAumentoPrecoPendentes(
      enviarAviso: EnviarAvisoAumentoPreco,
    ) {
      return new ProcessarAvisosAumentoPrecoPendentes(
        assinaturaRepo,
        enviarAviso,
      );
    },
  };
}

export function createAssinaturaModuleFromEnv(
  env: NodeJS.ProcessEnv = process.env,
) {
  const asaasApiKey = env.ASAAS_API_KEY?.trim() ?? "";
  const asaasWebhookToken = env.ASAAS_WEBHOOK_TOKEN?.trim() ?? "";
  if (!asaasApiKey || !asaasWebhookToken) {
    throw new Error(
      "ASAAS_API_KEY e ASAAS_WEBHOOK_TOKEN são obrigatórios.",
    );
  }

  return createAssinaturaModule({
    asaasApiKey,
    asaasWebhookToken,
    asaasApiUrl: env.ASAAS_API_URL?.trim() || undefined,
  });
}
