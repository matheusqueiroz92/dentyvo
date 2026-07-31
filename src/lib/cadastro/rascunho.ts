import {
  isPlanoCadastroId,
  type PlanoCadastroId,
} from "@/lib/cadastro/planos";

/**
 * Rascunho da etapa 1 (dados pessoais + plano) — sem senha.
 *
 * Persistido em `sessionStorage`. A senha fica só em memória de módulo
 * (`senhaCadastroEmMemoria`), para não gravar credencial em texto puro.
 *
 * TODO(cadastro-abandonado): se o usuário fechar o navegador entre as etapas,
 * o rascunho some e a senha em memória também — é preciso recomeçar em
 * `/cadastro` (ou reinformar a senha na etapa 2 se só o rascunho restar).
 * Como a etapa 1 não cria usuário/clínica, não ficam órfãos no DB.
 */
export const RASCUNHO_CADASTRO_KEY = "dentyvo.cadastro.rascunho.v2";
/** Chave legada (v1 incluía senha) — limpa ao ler/salvar. */
const RASCUNHO_CADASTRO_KEY_LEGADA = "dentyvo.cadastro.rascunho.v1";

export type RascunhoCadastro = {
  adminNome: string;
  email: string;
  planoId: PlanoCadastroId;
};

/** Senha da etapa 1 — só sobrevive a navegações SPA; some no reload. */
let senhaCadastroEmMemoria: string | null = null;

export function salvarSenhaCadastroEmMemoria(senha: string): void {
  senhaCadastroEmMemoria = senha;
}

export function lerSenhaCadastroEmMemoria(): string | null {
  return senhaCadastroEmMemoria;
}

export function limparSenhaCadastroEmMemoria(): void {
  senhaCadastroEmMemoria = null;
}

export function salvarRascunhoCadastro(rascunho: RascunhoCadastro): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(RASCUNHO_CADASTRO_KEY_LEGADA);
  sessionStorage.setItem(
    RASCUNHO_CADASTRO_KEY,
    JSON.stringify({
      adminNome: rascunho.adminNome,
      email: rascunho.email,
      planoId: rascunho.planoId,
    }),
  );
}

export function lerRascunhoCadastro(): RascunhoCadastro | null {
  if (typeof window === "undefined") return null;
  sessionStorage.removeItem(RASCUNHO_CADASTRO_KEY_LEGADA);
  const raw = sessionStorage.getItem(RASCUNHO_CADASTRO_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<RascunhoCadastro> & {
      senha?: unknown;
    };
    if (
      typeof parsed.adminNome !== "string" ||
      typeof parsed.email !== "string" ||
      typeof parsed.planoId !== "string" ||
      !isPlanoCadastroId(parsed.planoId)
    ) {
      return null;
    }
    return {
      adminNome: parsed.adminNome,
      email: parsed.email,
      planoId: parsed.planoId,
    };
  } catch {
    return null;
  }
}

export function limparRascunhoCadastro(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(RASCUNHO_CADASTRO_KEY);
  sessionStorage.removeItem(RASCUNHO_CADASTRO_KEY_LEGADA);
  limparSenhaCadastroEmMemoria();
}
