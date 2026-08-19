"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Link2Off,
  MessageCircle,
} from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  concluirConexaoWhatsappAction,
  desconectarWhatsappAction,
  iniciarConexaoWhatsappAction,
  obterStatusWhatsappAction,
} from "@/actions/whatsapp";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { StatusWhatsappDTO } from "@/lib/configuracoes/whatsapp-types";
import {
  abrirEmbeddedSignup,
  EmbeddedSignupCanceladoError,
} from "@/lib/whatsapp/embedded-signup";

const APRESENTACAO_STATUS = {
  conectado: {
    rotulo: "Conectado",
    variant: "success" as const,
    Icone: CheckCircle2,
    descricao:
      "Seu número está recebendo mensagens pela plataforma. O atendimento automático entra no ar quando o bot for liberado.",
  },
  pendente: {
    rotulo: "Pendente",
    variant: "warning" as const,
    Icone: Clock,
    descricao:
      "A conexão foi iniciada mas não concluída. Refaça o processo para finalizar a autorização na Meta.",
  },
  desconectado: {
    rotulo: "Desconectado",
    variant: "outline" as const,
    Icone: Link2Off,
    descricao:
      "Nenhum número conectado. Conecte o WhatsApp da clínica para começar.",
  },
} satisfies Record<
  StatusWhatsappDTO["status"],
  {
    rotulo: string;
    variant: "success" | "warning" | "outline";
    Icone: typeof CheckCircle2;
    descricao: string;
  }
>;

const formatadorData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function formatarIso(iso: string | null): string | null {
  if (!iso) return null;
  const data = new Date(iso);
  return Number.isNaN(data.getTime()) ? null : formatadorData.format(data);
}

export function AbaWhatsapp() {
  const [status, setStatus] = useState<StatusWhatsappDTO | null>(null);
  const [papel, setPapel] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [conectando, setConectando] = useState(false);
  const [pending, startTransition] = useTransition();

  const carregar = useCallback(() => {
    startTransition(async () => {
      const result = await obterStatusWhatsappAction();
      if (result.serverError) {
        setErro(result.serverError.mensagem);
        return;
      }
      if (!result.data) {
        setErro("Não foi possível carregar o status da conexão.");
        return;
      }
      setErro(null);
      setPapel(result.data.papel);
      setStatus(result.data.status);
    });
  }, [startTransition]);

  useEffect(carregar, [carregar]);

  async function conectar() {
    setConectando(true);
    try {
      const inicio = await iniciarConexaoWhatsappAction();
      if (inicio.serverError) {
        toast.error(inicio.serverError.mensagem);
        return;
      }
      if (!inicio.data) {
        toast.error("Não foi possível iniciar a conexão.");
        return;
      }

      const codigoOAuth = await abrirEmbeddedSignup(inicio.data);

      const conclusao = await concluirConexaoWhatsappAction({ codigoOAuth });
      if (conclusao.serverError) {
        toast.error(conclusao.serverError.mensagem);
        return;
      }

      toast.success("WhatsApp conectado");
      if (conclusao.data) {
        setStatus(conclusao.data);
      }
    } catch (erroConexao) {
      if (erroConexao instanceof EmbeddedSignupCanceladoError) {
        toast.info("Conexão cancelada. Nenhuma alteração foi feita.");
      } else {
        toast.error(
          erroConexao instanceof Error
            ? erroConexao.message
            : "Falha inesperada ao conectar.",
        );
      }
    } finally {
      setConectando(false);
      carregar();
    }
  }

  function desconectar() {
    startTransition(async () => {
      const result = await desconectarWhatsappAction();
      if (result.serverError) {
        toast.error(result.serverError.mensagem);
        return;
      }
      toast.success("WhatsApp desconectado");
      carregar();
    });
  }

  if (erro && !status) {
    return (
      <div className="space-y-3">
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          onClick={carregar}
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!status) {
    return (
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Carregando…
      </p>
    );
  }

  if (papel !== "admin") {
    return (
      <p className="text-sm text-muted-foreground">
        Apenas administradores podem gerenciar a conexão do WhatsApp.
      </p>
    );
  }

  const apresentacao = APRESENTACAO_STATUS[status.status];
  const conectadoEm = formatarIso(status.conectadoEmIso);
  const tokenExpiraEm = formatarIso(status.tokenExpiraEmIso);
  const ocupado = pending || conectando;

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">Conexão do WhatsApp</h2>
          <p className="text-sm text-muted-foreground">
            Conecte o número da clínica pelo fluxo oficial da Meta. A plataforma
            não guarda sua senha — apenas a autorização emitida pela Meta.
          </p>
        </div>

        <div className="space-y-3 rounded-lg border border-border p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={apresentacao.variant}>
              <apresentacao.Icone className="size-3" aria-hidden />
              {apresentacao.rotulo}
            </Badge>
            {status.phoneNumberId ? (
              <span className="text-xs text-muted-foreground tabular-nums">
                ID do número: {status.phoneNumberId}
              </span>
            ) : null}
          </div>

          <p className="text-sm text-muted-foreground">
            {apresentacao.descricao}
          </p>

          {conectadoEm || tokenExpiraEm ? (
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              {conectadoEm ? (
                <div>
                  <dt className="text-muted-foreground">Conectado em</dt>
                  <dd className="tabular-nums">{conectadoEm}</dd>
                </div>
              ) : null}
              {tokenExpiraEm ? (
                <div>
                  <dt className="text-muted-foreground">
                    Autorização expira em
                  </dt>
                  <dd className="tabular-nums">{tokenExpiraEm}</dd>
                </div>
              ) : null}
            </dl>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            className="min-h-11"
            disabled={ocupado}
            onClick={() => void conectar()}
          >
            <MessageCircle className="size-4" aria-hidden />
            {status.status === "conectado"
              ? "Reconectar número"
              : "Conectar WhatsApp"}
          </Button>

          {status.status !== "desconectado" ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  disabled={ocupado}
                >
                  <Link2Off className="size-4" aria-hidden />
                  Desconectar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Desconectar o WhatsApp da clínica?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    A plataforma para de receber e responder mensagens neste
                    número imediatamente. A autorização guardada é apagada, e
                    reconectar exige passar pelo fluxo da Meta novamente. As
                    conversas já registradas não são excluídas.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="min-h-11">
                    Manter conectado
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="min-h-11"
                    onClick={desconectar}
                  >
                    Desconectar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </div>

        {status.status === "pendente" ? (
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0 text-warning"
              aria-hidden
            />
            <span>
              Se você fechou o popup da Meta antes de terminar, basta clicar em
              conectar novamente.
            </span>
          </p>
        ) : null}
      </section>
    </div>
  );
}
