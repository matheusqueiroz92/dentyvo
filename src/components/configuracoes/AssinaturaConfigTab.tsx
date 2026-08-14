"use client";

import { CircleAlert, Sparkles } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

import { obterDetalhesAssinaturaAction } from "@/actions/configuracoes-assinatura";
import { HistoricoCobrancaTable } from "@/components/configuracoes/HistoricoCobrancaTable";
import { StatusAssinaturaBadge } from "@/components/configuracoes/StatusAssinaturaBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { LIMITE_VAGAS_PROMOCIONAIS_LANCAMENTO } from "@/core/assinatura/domain/constants";
import type { DetalhesAssinaturaDTO } from "@/lib/configuracoes/assinatura-types";
import { formatarDataPainel } from "@/lib/configuracoes/formatar-data-painel";
import {
  promocaoAindaAtiva,
  promocaoJaEncerrada,
} from "@/lib/configuracoes/promocao-painel";
import { formatBRL } from "@/lib/design-tokens";

export function AssinaturaConfigTab() {
  const [detalhes, setDetalhes] = useState<DetalhesAssinaturaDTO | null>(null);
  const [papel, setPapel] = useState<string | null>(null);
  const [erro, setErro] = useState<{ codigo: string; mensagem: string } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelado = false;
    startTransition(async () => {
      const result = await obterDetalhesAssinaturaAction();
      if (cancelado) return;
      if (result.serverError) {
        setErro(result.serverError);
        return;
      }
      if (!result.data) {
        setErro({
          codigo: "ErroInesperado",
          mensagem: "Não foi possível carregar a assinatura.",
        });
        return;
      }
      setPapel(result.data.papel);
      setDetalhes(result.data.detalhes);
    });
    return () => {
      cancelado = true;
    };
  }, [startTransition]);

  if (erro && !detalhes) {
    if (erro.codigo === "AssinaturaNaoEncontradaError") {
      return (
        <EmptyState
          title="Assinatura não encontrada"
          description="Não encontramos uma assinatura para esta clínica. Entre em contato com o suporte da Dentyvo para regularizar o cadastro."
        />
      );
    }
    return (
      <Alert variant="destructive">
        <AlertTitle>Não foi possível carregar a assinatura</AlertTitle>
        <AlertDescription>{erro.mensagem}</AlertDescription>
      </Alert>
    );
  }

  if (!detalhes || pending) {
    return (
      <div
        className="space-y-3"
        aria-busy="true"
        aria-label="Carregando assinatura"
      >
        <Skeleton className="h-11 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (papel !== "admin") {
    return (
      <p className="text-sm text-muted-foreground">
        Apenas administradores podem ver os dados da assinatura.
      </p>
    );
  }

  const nomePlano = detalhes.plano?.nome ?? "Período de trial";
  const vigente = promocaoAindaAtiva(detalhes);
  const encerrada = promocaoJaEncerrada(detalhes);
  const valorExibido = encerrada && detalhes.plano
    ? formatBRL(detalhes.plano.valorMensal)
    : detalhes.valorEfetivoCentavos != null
      ? formatBRL(detalhes.valorEfetivoCentavos / 100)
      : null;

  return (
    <div className="space-y-4">
      {detalhes.linkRegularizacao ? (
        <Alert variant="warning">
          <CircleAlert aria-hidden />
          <AlertTitle>Pagamento em aberto</AlertTitle>
          <AlertDescription>
            Há uma cobrança pendente ou vencida. Regularize para evitar a
            interrupção do acesso.
          </AlertDescription>
          <div className="col-start-2 mt-3">
            <Button asChild className="min-h-11">
              <a
                href={detalhes.linkRegularizacao}
                target="_blank"
                rel="noopener noreferrer"
              >
                Regularizar pagamento
              </a>
            </Button>
          </div>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{nomePlano}</CardTitle>
          <CardDescription>
            Acompanhe o status e a próxima cobrança da clínica.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <dt className="text-xs text-muted-foreground">Status</dt>
              <dd>
                <StatusAssinaturaBadge status={detalhes.status} />
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs text-muted-foreground">
                Próxima cobrança
              </dt>
              <dd className="text-sm tabular-nums text-foreground">
                {detalhes.dataProximaCobrancaIso
                  ? formatarDataPainel(detalhes.dataProximaCobrancaIso)
                  : "Sem data prevista"}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {detalhes.vagaPromocional ? (
        <Alert variant="info">
          <Sparkles aria-hidden />
          <AlertTitle>Vaga promocional de lançamento</AlertTitle>
          <AlertDescription>
            Você é a clínica nº {detalhes.vagaPromocional.posicao} das{" "}
            {LIMITE_VAGAS_PROMOCIONAIS_LANCAMENTO} primeiras da Dentyvo.
          </AlertDescription>
        </Alert>
      ) : null}

      {detalhes.plano ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Valor vigente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {valorExibido ? (
              <p className="text-2xl font-semibold tabular-nums tracking-tight">
                {valorExibido}
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  /mês
                </span>
              </p>
            ) : null}
            {vigente && detalhes.precoPromocionalAteIso ? (
              <p className="text-sm text-muted-foreground">
                Preço promocional válido até{" "}
                {formatarDataPainel(detalhes.precoPromocionalAteIso)}.
              </p>
            ) : null}
            {encerrada && detalhes.migradaParaPrecoCheioEmIso ? (
              <p className="text-sm text-muted-foreground">
                A promoção encerrou em{" "}
                {formatarDataPainel(detalhes.migradaParaPrecoCheioEmIso)}. O
                valor atual é o preço cheio do plano.
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-2">
        <h2 className="text-base font-semibold">Histórico de cobranças</h2>
        <p className="text-sm text-muted-foreground">
          Até as 12 cobranças mais recentes da assinatura.
        </p>
        <HistoricoCobrancaTable itens={detalhes.historicoCobranca} />
      </div>
    </div>
  );
}
