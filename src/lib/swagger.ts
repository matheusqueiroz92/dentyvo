import { createSwaggerSpec } from "next-swagger-doc";

export type SpecOpenApi = {
  openapi?: string;
  info?: {
    title?: string;
    version?: string;
    description?: string;
  };
  paths?: Record<string, unknown>;
};

/**
 * `/api-docs` só em development/test — em produção a página responde 404
 * para não expor contratos de webhook/auth publicamente.
 */
export function apiDocsLiberado(
  nodeEnv: string | undefined = process.env.NODE_ENV,
): boolean {
  return nodeEnv !== "production";
}

/**
 * @swagger
 * /api/whatsapp/webhook:
 *   get:
 *     tags:
 *       - WhatsApp
 *     summary: Verificação do webhook (Meta Cloud API)
 *     description: >
 *       Handshake exigido pela Meta (`hub.mode`, `hub.verify_token`,
 *       `hub.challenge`). O valor do verify token e demais segredos não
 *       são descritos nesta spec.
 *     parameters:
 *       - in: query
 *         name: hub.mode
 *         schema:
 *           type: string
 *       - in: query
 *         name: hub.verify_token
 *         schema:
 *           type: string
 *       - in: query
 *         name: hub.challenge
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Challenge ecoado quando a verificação é aceita
 *       403:
 *         description: Verificação rejeitada
 *   post:
 *     tags:
 *       - WhatsApp
 *     summary: Eventos inbound da Cloud API
 *     description: >
 *       Endpoint compartilhado entre clínicas (specs 007/008). A assinatura
 *       da Meta é validada antes de processar. Eventos de `phone_number_id`
 *       desconhecido são descartados com log e a resposta permanece de
 *       sucesso (não 5xx). Algoritmo de assinatura e segredos não entram
 *       nesta spec.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Evento aceito (processado ou descartado com segurança)
 */
export async function getApiDocs(): Promise<SpecOpenApi> {
  const spec = createSwaggerSpec({
    apiFolder: "src/app/api",
    schemaFolders: ["src/lib"],
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Dentyvo API",
        version: "0.1.0",
        description: [
          "Rotas HTTP de integração da plataforma (auth Better Auth e webhook WhatsApp).",
          "",
          "O agendamento público (`/agendar/{slug}` e `/agendar/{slug}/{profissionalSlug}`) é página + Server Action (`marcarConsultaPublicaAction` e afins), não API REST — por isso não aparece como path OpenAPI.",
          "",
          "Esta UI não fica acessível publicamente em produção.",
        ].join("\n"),
      },
    },
  });

  return spec as SpecOpenApi;
}
