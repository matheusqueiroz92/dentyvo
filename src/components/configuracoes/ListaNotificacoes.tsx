"use client";

import { BellOff, CheckCheck } from "lucide-react";

import {
  formatarDataCurta,
  formatarHorario,
} from "@/components/dashboard/formatacao";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState } from "@/components/ui/empty-state";
import type { NotificacaoDashboardDTO } from "@/lib/dashboard/types";
import { linhasConteudoExibivel } from "@/lib/notificacoes/conteudo-exibivel";
import { rotuloTipoNotificacao } from "@/lib/notificacoes/rotulo-tipo";

type Props = {
  itens: NotificacaoDashboardDTO[];
  onMarcarComoLida: (id: string) => void;
  onMarcarTodas: () => void;
  marcandoId?: string | null;
  marcandoTodas?: boolean;
};

export function ListaNotificacoes({
  itens,
  onMarcarComoLida,
  onMarcarTodas,
  marcandoId = null,
  marcandoTodas = false,
}: Props) {
  if (itens.length === 0) {
    return (
      <EmptyState icon={BellOff} title="Nenhuma notificação pendente." />
    );
  }

  const ocupado = marcandoTodas || marcandoId != null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          disabled={ocupado}
          onClick={onMarcarTodas}
        >
          <CheckCheck className="size-4" aria-hidden />
          Marcar todas como lidas
        </Button>
      </div>
      <ul className="divide-y divide-border rounded-lg border border-border" role="list">
        {itens.map((n) => {
          const extra = linhasConteudoExibivel(n);
          const marcandoEste = marcandoTodas || marcandoId === n.id;
          const rotuloTipo = rotuloTipoNotificacao(n.tipo);
          return (
            <li key={n.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="info">{rotuloTipo}</Badge>
                  <time
                    dateTime={n.criadaEmIso}
                    className="text-[12px] text-muted-foreground tabular-nums"
                  >
                    {formatarDataCurta(n.criadaEmIso)} · {formatarHorario(n.criadaEmIso)}
                  </time>
                </div>
                {n.titulo && n.titulo !== rotuloTipo ? (
                  <p className="text-sm font-medium">{n.titulo}</p>
                ) : null}
                {n.mensagem ? (
                  <p className="text-[13px] leading-5 text-muted-foreground">
                    {n.mensagem}
                  </p>
                ) : null}
                {extra.length > 0 ? (
                  <dl className="grid gap-1 text-[13px] text-muted-foreground">
                    {extra.map((linha) => (
                      <div key={linha.chave} className="flex flex-wrap gap-x-2">
                        <dt className="font-medium text-foreground">{linha.rotulo}</dt>
                        <dd className="tabular-nums">{linha.valor}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
                {n.linkAcao ? (
                  <ButtonLink
                    href={n.linkAcao}
                    variant="link"
                    size="sm"
                    className="min-h-11 px-0"
                  >
                    Abrir
                  </ButtonLink>
                ) : null}
              </div>
              <Button
                type="button"
                variant="secondary"
                className="min-h-11 shrink-0"
                disabled={ocupado}
                onClick={() => onMarcarComoLida(n.id)}
              >
                {marcandoEste ? "Marcando…" : "Marcar como lida"}
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
