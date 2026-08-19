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
