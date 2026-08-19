import { ProcessarRenovacaoTokensWhatsapp } from "@/core/whatsapp-bot/application/use-cases";
import { createWhatsappBotModuleFromEnv } from "@/core/whatsapp-bot/infra/create-whatsapp-bot-module";
import { cronAutorizado } from "@/lib/cron/autorizar-cron";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/cron/whatsapp-renovar-tokens:
 *   post:
 *     tags:
 *       - WhatsApp
 *     summary: Job de renovação de token das contas conectadas
 *     description: >
 *       Disparado por Vercel Cron (`vercel.json` → `crons`) e autenticado por
 *       `Authorization: Bearer $CRON_SECRET`. Renova os tokens cuja expiração
 *       entra na janela de antecedência da spec 008 (7 dias). Contas cujo
 *       token a Meta rejeita passam a `desconectado`.
 *     responses:
 *       200:
 *         description: Lote processado
 *       401:
 *         description: Segredo do cron ausente ou inválido
 */
async function executarJob(request: Request): Promise<Response> {
  if (
    !cronAutorizado(
      request.headers.get("authorization"),
      process.env.CRON_SECRET,
    )
  ) {
    return new Response(null, { status: 401 });
  }

  const { contaRepo, renovarTokenWhatsapp } = createWhatsappBotModuleFromEnv();
  const job = new ProcessarRenovacaoTokensWhatsapp(
    contaRepo,
    renovarTokenWhatsapp,
  );

  const resultado = await job.executar();
  console.info("[whatsapp:renovacao-token] lote concluído", resultado);

  return Response.json(resultado);
}

/** Vercel Cron chama via GET; POST fica disponível para disparo manual. */
export async function GET(request: Request): Promise<Response> {
  return executarJob(request);
}

export async function POST(request: Request): Promise<Response> {
  return executarJob(request);
}
