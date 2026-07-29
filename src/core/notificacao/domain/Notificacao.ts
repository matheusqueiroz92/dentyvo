import { DadosInvalidosError } from "@/core/shared/errors";

import {
  calcularJanelaDedup,
  JANELA_DEDUP_MS,
} from "./constants";
import type { ConteudoNotificacao } from "./ConteudoNotificacao";
import { sanitizarConteudoNotificacao } from "./ConteudoNotificacao";
import type { DestinatarioNotificacao } from "./DestinatarioNotificacao";
import { mesmosDestinatarios } from "./DestinatarioNotificacao";
import {
  CanalAusenteError,
  TransicaoStatusEnvioInvalidaError,
} from "./errors";
import {
  CANAIS_NOTIFICACAO,
  type CanalNotificacao,
  podeTransicionarStatusEnvio,
  type StatusEnvio,
  TIPOS_NOTIFICACAO,
  type TipoNotificacao,
} from "./StatusEnvio";

export type EnvioPorCanal = {
  canal: CanalNotificacao;
  statusEnvio: StatusEnvio;
};

export type NotificacaoProps = {
  id: string;
  destinatarioUsuarioId: string | null;
  destinatarioUsuarioPlataformaId: string | null;
  tipo: TipoNotificacao;
  /**
   * Id opaco do evento de origem (cobrancaId, conviteId, …).
   * Null = dedup por identidade de evento não se aplica.
   */
  chaveNegocio: string | null;
  conteudo: ConteudoNotificacao;
  envios: EnvioPorCanal[];
  lida: boolean;
  lidaEm: Date | null;
  criadaEm: Date;
  /**
   * Bucket da janela de dedup no momento da criação (persistido para
   * UNIQUE no adapter). Ver `calcularJanelaDedup`.
   */
  janelaDedup: number | null;
};

/**
 * Notificação persistida (spec 011).
 * Um registro = um evento lógico; `envios` carrega status por canal no
 * agregado. Na persistência, o adapter materializa `envios` em tabela
 * normalizada (`notificacao_envio`), não JSON na linha de `notificacao`.
 */
export class Notificacao {
  readonly id: string;
  readonly destinatarioUsuarioId: string | null;
  readonly destinatarioUsuarioPlataformaId: string | null;
  readonly tipo: TipoNotificacao;
  readonly chaveNegocio: string | null;
  readonly conteudo: ConteudoNotificacao;
  readonly envios: readonly EnvioPorCanal[];
  readonly lida: boolean;
  readonly lidaEm: Date | null;
  readonly criadaEm: Date;
  readonly janelaDedup: number | null;

  private constructor(props: NotificacaoProps) {
    this.id = props.id;
    this.destinatarioUsuarioId = props.destinatarioUsuarioId;
    this.destinatarioUsuarioPlataformaId = props.destinatarioUsuarioPlataformaId;
    this.tipo = props.tipo;
    this.chaveNegocio = props.chaveNegocio;
    this.conteudo = props.conteudo;
    this.envios = props.envios;
    this.lida = props.lida;
    this.lidaEm = props.lidaEm;
    this.criadaEm = props.criadaEm;
    this.janelaDedup = props.janelaDedup;
  }

  get destinatario(): DestinatarioNotificacao {
    if (this.destinatarioUsuarioId != null) {
      return { kind: "usuario", usuarioId: this.destinatarioUsuarioId };
    }
    return {
      kind: "usuario_plataforma",
      usuarioPlataformaId: this.destinatarioUsuarioPlataformaId as string,
    };
  }

  static criar(input: {
    id: string;
    destinatario: DestinatarioNotificacao;
    tipo: TipoNotificacao;
    canais: CanalNotificacao[];
    conteudo: ConteudoNotificacao;
    chaveNegocio?: string | null;
    criadaEm?: Date;
  }): Notificacao {
    const id = assertCampo(input.id, "id");
    if (!(TIPOS_NOTIFICACAO as readonly string[]).includes(input.tipo)) {
      throw new DadosInvalidosError(`Tipo de notificação inválido: ${input.tipo}`);
    }
    if (!input.canais || input.canais.length === 0) {
      throw new DadosInvalidosError("Informe ao menos um canal.");
    }
    const canaisUnicos = [...new Set(input.canais)];
    for (const canal of canaisUnicos) {
      if (!(CANAIS_NOTIFICACAO as readonly string[]).includes(canal)) {
        throw new DadosInvalidosError(`Canal inválido: ${canal}`);
      }
    }

    const { destinatarioUsuarioId, destinatarioUsuarioPlataformaId } =
      normalizarDestinatario(input.destinatario);

    const criadaEm = input.criadaEm ?? new Date();
    assertDataValida(criadaEm, "criadaEm");

    const chaveNegocio = normalizarChave(input.chaveNegocio);
    const janelaDedup =
      chaveNegocio != null ? calcularJanelaDedup(criadaEm) : null;

    return new Notificacao({
      id,
      destinatarioUsuarioId,
      destinatarioUsuarioPlataformaId,
      tipo: input.tipo,
      chaveNegocio,
      conteudo: sanitizarConteudoNotificacao(input.conteudo),
      envios: canaisUnicos.map((canal) => ({
        canal,
        statusEnvio: "pendente",
      })),
      lida: false,
      lidaEm: null,
      criadaEm,
      janelaDedup,
    });
  }

  static reconstituir(props: NotificacaoProps): Notificacao {
    return new Notificacao(props);
  }

  /**
   * Regra de domínio testável: mesma identidade de evento na janela de 1h.
   * Sem `chaveNegocio` em qualquer um dos lados → nunca é duplicata por
   * identidade (spec 011).
   */
  ehDuplicataDe(
    outra: Notificacao,
    janelaMs: number = JANELA_DEDUP_MS,
  ): boolean {
    if (this.chaveNegocio == null || outra.chaveNegocio == null) {
      return false;
    }
    if (this.tipo !== outra.tipo) return false;
    if (this.chaveNegocio !== outra.chaveNegocio) return false;
    if (!mesmosDestinatarios(this.destinatario, outra.destinatario)) {
      return false;
    }
    return (
      calcularJanelaDedup(this.criadaEm, janelaMs) ===
      calcularJanelaDedup(outra.criadaEm, janelaMs)
    );
  }

  statusDoCanal(canal: CanalNotificacao): StatusEnvio {
    const envio = this.envios.find((e) => e.canal === canal);
    if (!envio) throw new CanalAusenteError(canal);
    return envio.statusEnvio;
  }

  marcarCanalComoEnviado(canal: CanalNotificacao): Notificacao {
    return this.transicionarCanal(canal, "enviada");
  }

  marcarCanalComoFalhou(canal: CanalNotificacao): Notificacao {
    return this.transicionarCanal(canal, "falhou");
  }

  marcarComoLida(lidaEm?: Date): Notificacao {
    if (this.lida) return this;
    const em = lidaEm ?? new Date();
    assertDataValida(em, "lidaEm");
    return new Notificacao({
      ...this.paraProps(),
      lida: true,
      lidaEm: em,
    });
  }

  pertenceAoDestinatario(destinatario: DestinatarioNotificacao): boolean {
    return mesmosDestinatarios(this.destinatario, destinatario);
  }

  private transicionarCanal(
    canal: CanalNotificacao,
    destino: StatusEnvio,
  ): Notificacao {
    const atual = this.statusDoCanal(canal);
    if (!podeTransicionarStatusEnvio(atual, destino)) {
      throw new TransicaoStatusEnvioInvalidaError(canal, atual, destino);
    }
    return new Notificacao({
      ...this.paraProps(),
      envios: this.envios.map((e) =>
        e.canal === canal ? { canal, statusEnvio: destino } : e,
      ),
    });
  }

  private paraProps(): NotificacaoProps {
    return {
      id: this.id,
      destinatarioUsuarioId: this.destinatarioUsuarioId,
      destinatarioUsuarioPlataformaId: this.destinatarioUsuarioPlataformaId,
      tipo: this.tipo,
      chaveNegocio: this.chaveNegocio,
      conteudo: this.conteudo,
      envios: [...this.envios],
      lida: this.lida,
      lidaEm: this.lidaEm,
      criadaEm: this.criadaEm,
      janelaDedup: this.janelaDedup,
    };
  }
}

function normalizarDestinatario(destinatario: DestinatarioNotificacao): {
  destinatarioUsuarioId: string | null;
  destinatarioUsuarioPlataformaId: string | null;
} {
  if (destinatario.kind === "usuario") {
    return {
      destinatarioUsuarioId: assertCampo(
        destinatario.usuarioId,
        "destinatario.usuarioId",
      ),
      destinatarioUsuarioPlataformaId: null,
    };
  }
  return {
    destinatarioUsuarioId: null,
    destinatarioUsuarioPlataformaId: assertCampo(
      destinatario.usuarioPlataformaId,
      "destinatario.usuarioPlataformaId",
    ),
  };
}

function normalizarChave(chave: string | null | undefined): string | null {
  if (chave == null) return null;
  const trimmed = chave.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function assertCampo(valor: string, campo: string): string {
  const trimmed = valor.trim();
  if (!trimmed) {
    throw new DadosInvalidosError(`${campo} é obrigatório.`);
  }
  return trimmed;
}

function assertDataValida(data: Date, campo: string): void {
  if (!(data instanceof Date) || Number.isNaN(data.getTime())) {
    throw new DadosInvalidosError(`${campo} inválida.`);
  }
}
