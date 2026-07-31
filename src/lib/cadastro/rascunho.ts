import {
  isPlanoCadastroId,
  type PlanoCadastroId,
} from "@/lib/cadastro/planos";

/**
 * Rascunho da etapa 1 do cadastro (dados pessoais + plano).
 *
 * Persistido só em `sessionStorage` — nada no banco até a etapa 2.
 *
 * TODO(cadastro-abandonado): se o usuário fechar o navegador entre as etapas,
 * o rascunho some e não há recuperação automática — é preciso recomeçar em
 * `/cadastro`. Como a etapa 1 não cria usuário/clínica, não ficam órfãos no DB.
 */
export const RASCUNHO_CADASTRO_KEY = "dentyvo.cadastro.rascunho.v1";

export type RascunhoCadastro = {
  adminNome: string;
  email: string;
  senha: string;
  planoId: PlanoCadastroId;
};

export function salvarRascunhoCadastro(rascunho: RascunhoCadastro): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(RASCUNHO_CADASTRO_KEY, JSON.stringify(rascunho));
}

export function lerRascunhoCadastro(): RascunhoCadastro | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(RASCUNHO_CADASTRO_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<RascunhoCadastro>;
    if (
      typeof parsed.adminNome !== "string" ||
      typeof parsed.email !== "string" ||
      typeof parsed.senha !== "string" ||
      typeof parsed.planoId !== "string" ||
      !isPlanoCadastroId(parsed.planoId)
    ) {
      return null;
    }
    return {
      adminNome: parsed.adminNome,
      email: parsed.email,
      senha: parsed.senha,
      planoId: parsed.planoId,
    };
  } catch {
    return null;
  }
}

export function limparRascunhoCadastro(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(RASCUNHO_CADASTRO_KEY);
}
