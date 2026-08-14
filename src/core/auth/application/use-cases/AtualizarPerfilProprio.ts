import { DadosInvalidosError } from "@/core/shared/errors";

import {
  PerfilProprioDessincronizadoError,
  PerfilProprioNaoAutorizadoError,
  ProfissionalNaoEncontradoError,
} from "../../domain/errors";
import type { Profissional } from "../../domain/Profissional";
import type { AuthPort } from "../ports/AuthPort";
import type { ProfissionalRepositoryPort } from "../ports/ProfissionalRepositoryPort";

/**
 * Input de `AtualizarPerfilProprio` (spec 001 — emenda Perfil próprio).
 * `nome` é obrigatório (P1). `usuarioId` deve ser o da sessão — nunca o
 * de outro membro.
 */
export type AtualizarPerfilProprioInput = {
  usuarioId: string;
  nome: string;
};

/**
 * Atualiza o próprio nome do profissional autenticado.
 *
 * Autorização: identidade (`obterContextoSessao().usuarioId` =
 * `input.usuarioId`), **não** matriz de papel. Qualquer
 * `admin` | `dentista` | `recepcao` altera só a si. Recusar com
 * `PerfilProprioNaoAutorizadoError` se a sessão não existir, se o
 * `usuarioId` do input for de outra pessoa, ou se o profissional
 * encontrado não for o dono da credencial (`assertEhOProprioUsuario`).
 *
 * ## Orquestração
 *
 * 1. Sessão via `AuthPort.obterContextoSessao`; identidade como acima.
 * 2. Carregar `Profissional` por `usuarioId`; validar nome com
 *    `atualizarNome` (trim; vazio → `DadosInvalidosError`; slug intacto).
 * 3. Escrita 1: `AuthPort.atualizarNome(usuarioId, nomeNormalizado)`.
 * 4. Escrita 2: `ProfissionalRepositoryPort.atualizarParcial`
 *    (`id`, `clinicaId`, `nome`).
 * 5. Falha parcial: ver decisão abaixo.
 *
 * Não há Unit of Work transversal, e `AuthPort` (BetterAuth) não
 * participa automaticamente de uma transação Drizzle mesmo as tabelas
 * `user` e `profissional` morando no mesmo Postgres. Não colapsar as
 * duas ports num adapter só.
 *
 * **Ordem:** (1) `AuthPort.atualizarNome` → (2) `atualizarParcial` do
 * profissional.
 *
 * Motivo da ordem: a UI lê `Profissional.nome`. Se (2) falhar, o Topbar
 * ainda mostra o nome antigo (falha visível, sem “sucesso fantasma”).
 *
 * **Se (2) falhar depois de (1) ter sucesso:** compensar (1) chamando
 * `AuthPort.atualizarNome` de novo com o nome anterior. O caso de uso
 * **falha** (propaga o erro de (2)); os dois stores voltam ao nome
 * antigo. Não é sucesso parcial.
 *
 * **Se a compensação também falhar:** lançar
 * `PerfilProprioDessincronizadoError` (`user.name` pode estar no nome
 * novo; `Profissional.nome` no antigo). Retry do mesmo comando
 * reconcilia (ambas as escritas para o nome pedido). Esse residual
 * entra no débito técnico da spec 001 até existir UoW.
 *
 */
export class AtualizarPerfilProprio {
  constructor(
    private readonly profissionalRepo: ProfissionalRepositoryPort,
    private readonly auth: AuthPort,
  ) {}

  async executar(input: AtualizarPerfilProprioInput): Promise<Profissional> {
    const nomeNormalizado = input.nome.trim();
    if (!nomeNormalizado) {
      throw new DadosInvalidosError("Nome do profissional é obrigatório.");
    }

    const sessao = await this.auth.obterContextoSessao();
    const atorId = sessao?.usuarioId ?? "";
    if (!sessao || sessao.usuarioId !== input.usuarioId) {
      throw new PerfilProprioNaoAutorizadoError(input.usuarioId, atorId);
    }

    const profissional = await this.profissionalRepo.buscarPorUsuarioId(
      input.usuarioId,
    );
    if (!profissional) {
      throw new ProfissionalNaoEncontradoError(input.usuarioId);
    }
    profissional.assertEhOProprioUsuario(input.usuarioId);

    const atualizado = profissional.atualizarNome(nomeNormalizado);
    const nomeAnterior = profissional.nome;

    await this.auth.atualizarNome(input.usuarioId, atualizado.nome);

    try {
      const persistida = await this.profissionalRepo.atualizarParcial({
        id: atualizado.id,
        clinicaId: atualizado.clinicaId,
        nome: atualizado.nome,
      });
      if (!persistida) {
        throw new ProfissionalNaoEncontradoError(atualizado.id);
      }
      return persistida;
    } catch (erro) {
      try {
        await this.auth.atualizarNome(input.usuarioId, nomeAnterior);
      } catch {
        throw new PerfilProprioDessincronizadoError(input.usuarioId);
      }
      throw erro;
    }
  }
}
