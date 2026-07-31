import {
  PRECO_PROMOCIONAL_CENTAVOS,
} from "@/core/assinatura/domain/constants";

/** IDs estáveis alinhados aos testes/domínio (spec 010/012). */
export const PLANOS_CADASTRO_IDS = [
  "plano-basico",
  "plano-medio",
  "plano-full",
] as const;

export type PlanoCadastroId = (typeof PLANOS_CADASTRO_IDS)[number];

export type PlanoMarketing = {
  id: PlanoCadastroId;
  slug: "basico" | "medio" | "full";
  nome: string;
  descricao: string;
  precoMinMensal: number;
  precoMaxMensal: number;
  precoPromocionalMensal?: number;
  recursos: string[];
  destaque?: boolean;
  badge?: string;
  /** Valor cheio usado ao garantir o plano no banco. */
  valorMensalCatalogo: number;
};

export const PLANOS_MARKETING: PlanoMarketing[] = [
  {
    id: "plano-basico",
    slug: "basico",
    nome: "Básico",
    descricao: "Essencial para organizar agenda e prontuário.",
    precoMinMensal: 79,
    precoMaxMensal: 99,
    precoPromocionalMensal: PRECO_PROMOCIONAL_CENTAVOS.basico / 100,
    recursos: ["Agendamento", "Prontuário", "Anamnese", "Receituário"],
    valorMensalCatalogo: 99,
  },
  {
    id: "plano-medio",
    slug: "medio",
    nome: "Médio",
    descricao: "Tudo do Básico, com atendimento automático no WhatsApp.",
    precoMinMensal: 149,
    precoMaxMensal: 179,
    precoPromocionalMensal: PRECO_PROMOCIONAL_CENTAVOS.medio / 100,
    recursos: [
      "Tudo do plano Básico",
      "Bot de WhatsApp",
      "Confirmações e respostas automáticas",
      "Ideal para clínicas com volume no WhatsApp",
    ],
    destaque: true,
    badge: "Mais popular",
    valorMensalCatalogo: 159,
  },
  {
    id: "plano-full",
    slug: "full",
    nome: "Full",
    descricao: "Para clínicas que precisam de escala e suporte prioritário.",
    precoMinMensal: 249,
    precoMaxMensal: 299,
    recursos: [
      "Tudo do plano Médio",
      "Profissionais ilimitados",
      "Suporte prioritário",
      "Odontograma e periograma completos",
    ],
    valorMensalCatalogo: 279,
  },
];

export function isPlanoCadastroId(value: string): value is PlanoCadastroId {
  return (PLANOS_CADASTRO_IDS as readonly string[]).includes(value);
}

/** Aceita `?plano=basico|medio|full` ou id completo `plano-basico`. */
export function resolverPlanoDaQuery(
  planoParam: string | null | undefined,
): PlanoCadastroId | null {
  if (!planoParam?.trim()) return null;
  const raw = planoParam.trim().toLowerCase();
  if (isPlanoCadastroId(raw)) return raw;
  const porSlug = PLANOS_MARKETING.find((p) => p.slug === raw);
  return porSlug?.id ?? null;
}

export function planoMarketingPorId(id: PlanoCadastroId): PlanoMarketing {
  const plano = PLANOS_MARKETING.find((p) => p.id === id);
  if (!plano) {
    throw new Error(`Plano de marketing desconhecido: ${id}`);
  }
  return plano;
}
