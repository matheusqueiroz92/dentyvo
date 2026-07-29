import type { Notificacao } from "../../domain/Notificacao";
import type { DestinatarioNotificacao } from "../../domain/DestinatarioNotificacao";
import type { TipoNotificacao } from "../../domain/StatusEnvio";

export type ResultadoCriarNotificacao = {
  notificacao: Notificacao;
  /** `false` quando a identidade de evento já existia na janela (dedup). */
  criada: boolean;
};

/**
 * Persistência de notificações (spec 011).
 *
 * ## Persistência de `envios`
 * O agregado de domínio carrega `envios` em memória; no banco o adapter
 * **deve** usar tabela normalizada (ex. `notificacao_envio` com FK
 * `notificacao_id`, `canal`, `status_envio`) — **não** coluna JSON/array
 * embutida em `notificacao`. Motivo: retenção indefinida no MVP (sem purge);
 * cardinalidade por notificação = nº de canais (≤ 2 no MVP).
 *
 * ## Dedup e concorrência
 * Quando `chaveNegocio` está presente, `criarSeNaoDuplicada` deve ser
 * **atômico** (mesmo espírito de EXCLUDE → `SobreposicaoHorarioError` na 002
 * e UNIQUE → `EvolucaoJaRetificadaError` na 003):
 *
 * 1. Domínio: `Notificacao.ehDuplicataDe` / `janelaDedup` =
 *    `floor(criadaEm / JANELA_DEDUP_MS)` — **balde fixo**, não janela
 *    deslizante (trade-off consciente na spec 011: 12:59 e 13:01 não
 *    deduplicam; objetivo é conter loop/spam no mesmo balde + corrida).
 * 2. Adapter: UNIQUE em
 *    `(tipo, destinatario_usuario_id, destinatario_plataforma_id, chave_negocio, janela_dedup)`
 *    WHERE `chave_negocio IS NOT NULL` (valores NULL de destinatário tratados
 *    de forma estável, ex. sentinela `''` ou colunas parciais).
 * 3. Em conflito: retornar a notificação já existente com `criada: false`
 *    (não lançar erro ao produtor — dedup é no-op de reenvio).
 *
 * Checagem otimista (`buscarDuplicadaNaJanela`) é opcional; a constraint é a
 * garantia final contra corrida entre duas chamadas simultâneas.
 *
 * Sem `chaveNegocio`, sempre insere (`criada: true`) — sem dedup.
 */
export interface NotificacaoRepositoryPort {
  /**
   * Insere se não houver duplicata na janela; senão devolve a existente.
   * @param janelaMs default `JANELA_DEDUP_MS` (1 hora)
   */
  criarSeNaoDuplicada(
    notificacao: Notificacao,
    janelaMs?: number,
  ): Promise<ResultadoCriarNotificacao>;

  /**
   * Checagem otimista (não substitui a atomicidade de `criarSeNaoDuplicada`).
   */
  buscarDuplicadaNaJanela(input: {
    tipo: TipoNotificacao;
    destinatario: DestinatarioNotificacao;
    chaveNegocio: string;
    referencia: Date;
    janelaMs?: number;
  }): Promise<Notificacao | null>;

  salvar(notificacao: Notificacao): Promise<void>;

  buscarPorId(notificacaoId: string): Promise<Notificacao | null>;

  listarNaoLidas(
    destinatario: DestinatarioNotificacao,
  ): Promise<Notificacao[]>;
}
