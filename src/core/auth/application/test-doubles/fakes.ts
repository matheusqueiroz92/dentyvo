import { randomUUID } from "node:crypto";

import type { Clinica } from "../../domain/Clinica";
import { SESSAO_TTL_MS } from "../../domain/constants";
import type { ContextoSessao } from "../../domain/ContextoSessao";
import type { Convite } from "../../domain/Convite";
import type { DocumentoFiscal } from "../../domain/DocumentoFiscal";
import type { Profissional } from "../../domain/Profissional";
import { Slug } from "@/core/shared/Slug";
import type { AuthPort, UsuarioAuth } from "../ports/AuthPort";
import type {
  ClinicaRepositoryPort,
  FiltrosListagemClinicas,
} from "../ports/ClinicaRepositoryPort";
import type { ConviteRepositoryPort } from "../ports/ConviteRepositoryPort";
import type { EmailPort, EmailConviteInput } from "../ports/EmailPort";
import type { ProfissionalRepositoryPort } from "../ports/ProfissionalRepositoryPort";

export class FakeClinicaRepository implements ClinicaRepositoryPort {
  readonly items = new Map<string, Clinica>();

  async salvar(clinica: Clinica): Promise<void> {
    this.items.set(clinica.id, clinica);
  }

  async buscarPorId(id: string): Promise<Clinica | null> {
    return this.items.get(id) ?? null;
  }

  async buscarPorDocumento(
    documento: DocumentoFiscal,
  ): Promise<Clinica | null> {
    return (
      [...this.items.values()].find((c) => c.documento.equals(documento)) ??
      null
    );
  }

  async buscarPorSlug(slug: string): Promise<Clinica | null> {
    const normalizado = Slug.criar(slug).valor;
    return (
      [...this.items.values()].find((c) => c.slug === normalizado) ?? null
    );
  }

  async listar(filtros?: FiltrosListagemClinicas): Promise<Clinica[]> {
    let resultado = [...this.items.values()];
    if (filtros?.status) {
      resultado = resultado.filter((c) => c.status === filtros.status);
    }
    if (filtros?.busca?.trim()) {
      const termo = filtros.busca.trim().toLowerCase();
      resultado = resultado.filter((c) =>
        c.nome.toLowerCase().includes(termo),
      );
    }
    return resultado;
  }
}

export class FakeProfissionalRepository implements ProfissionalRepositoryPort {
  readonly items = new Map<string, Profissional>();

  async salvar(profissional: Profissional): Promise<void> {
    this.items.set(profissional.id, profissional);
  }

  async buscarPorId(
    clinicaId: string,
    profissionalId: string,
  ): Promise<Profissional | null> {
    const encontrado = this.items.get(profissionalId);
    if (!encontrado || encontrado.clinicaId !== clinicaId) return null;
    return encontrado;
  }

  async buscarPorSlug(
    clinicaId: string,
    slug: string,
  ): Promise<Profissional | null> {
    const normalizado = Slug.criar(slug).valor;
    return (
      [...this.items.values()].find(
        (p) => p.clinicaId === clinicaId && p.slug === normalizado,
      ) ?? null
    );
  }

  async buscarPorUsuarioId(usuarioId: string): Promise<Profissional | null> {
    return (
      [...this.items.values()].find((p) => p.usuarioId === usuarioId) ?? null
    );
  }

  async listarPorClinica(clinicaId: string): Promise<Profissional[]> {
    return [...this.items.values()].filter((p) => p.clinicaId === clinicaId);
  }

  async remover(clinicaId: string, profissionalId: string): Promise<void> {
    const atual = this.items.get(profissionalId);
    if (atual?.clinicaId === clinicaId) {
      this.items.delete(profissionalId);
    }
  }
}

export class FakeConviteRepository implements ConviteRepositoryPort {
  readonly items = new Map<string, Convite>();

  async salvar(convite: Convite): Promise<void> {
    this.items.set(convite.id, convite);
  }

  async buscarPorToken(token: string): Promise<Convite | null> {
    return [...this.items.values()].find((c) => c.token === token) ?? null;
  }

  async buscarPendentePorEmailEClinica(
    clinicaId: string,
    email: string,
  ): Promise<Convite | null> {
    const normalizado = email.trim().toLowerCase();
    return (
      [...this.items.values()].find(
        (c) =>
          c.clinicaId === clinicaId &&
          c.email === normalizado &&
          c.estaPendente(),
      ) ?? null
    );
  }
}

type SessaoFake = {
  contexto: ContextoSessao;
  criadaEm: Date;
};

export class FakeAuthPort implements AuthPort {
  readonly usuarios = new Map<string, UsuarioAuth & { senha: string }>();
  readonly sessoesRevogadas: string[] = [];
  private sessao: SessaoFake | null = null;
  agora: Date = new Date();

  async criarUsuario(input: {
    nome: string;
    email: string;
    senha: string;
  }): Promise<UsuarioAuth> {
    const email = input.email.trim().toLowerCase();
    if ([...this.usuarios.values()].some((u) => u.email === email)) {
      throw new Error("E-mail já cadastrado.");
    }
    const usuario: UsuarioAuth & { senha: string } = {
      id: randomUUID(),
      nome: input.nome,
      email,
      senha: input.senha,
    };
    this.usuarios.set(usuario.id, usuario);
    return { id: usuario.id, nome: usuario.nome, email: usuario.email };
  }

  async buscarUsuarioPorEmail(email: string): Promise<UsuarioAuth | null> {
    const normalizado = email.trim().toLowerCase();
    const encontrado = [...this.usuarios.values()].find(
      (u) => u.email === normalizado,
    );
    if (!encontrado) return null;
    return {
      id: encontrado.id,
      nome: encontrado.nome,
      email: encontrado.email,
    };
  }

  /**
   * Sessão expira após SESSAO_TTL_MS (7 dias), conforme spec 001.
   */
  definirSessao(contexto: ContextoSessao, criadaEm?: Date): void {
    this.sessao = {
      contexto,
      criadaEm: criadaEm ?? this.agora,
    };
  }

  limparSessao(): void {
    this.sessao = null;
  }

  async obterContextoSessao(): Promise<ContextoSessao | null> {
    if (!this.sessao) return null;
    const idade = this.agora.getTime() - this.sessao.criadaEm.getTime();
    if (idade >= SESSAO_TTL_MS) return null;
    return this.sessao.contexto;
  }

  async revogarSessoesDoUsuario(usuarioId: string): Promise<void> {
    this.sessoesRevogadas.push(usuarioId);
    if (this.sessao?.contexto.usuarioId === usuarioId) {
      this.sessao = null;
    }
  }
}

export class FakeEmailPort implements EmailPort {
  readonly enviados: EmailConviteInput[] = [];

  async enviarConvite(input: EmailConviteInput): Promise<void> {
    this.enviados.push(input);
  }
}

/** CPF válido conhecido (apenas para testes). */
export const CPF_VALIDO = "39053344705";

/** CNPJ válido conhecido (apenas para testes). */
export const CNPJ_VALIDO = "11222333000181";
