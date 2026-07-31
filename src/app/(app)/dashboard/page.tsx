import { Suspense } from "react";

import {
  AgendaDoDiaSection,
  AtalhosRapidos,
  ConfirmacoesPendentesSection,
  DashboardCardSkeleton,
  NotificacoesCard,
  StatusAssinaturaSection,
} from "@/components/dashboard";
import { requireSessaoClinica } from "@/lib/dashboard/obter-sessao-clinica";

export const metadata = {
  title: "Dashboard — Dentyvo",
};

export default async function DashboardPage() {
  await requireSessaoClinica();

  return (
    <main className="flex flex-col gap-8">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl leading-[38px] font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="mt-1 text-sm leading-[22px] text-muted-foreground">
            Visão operacional do dia — agenda, confirmações e alertas.
          </p>
        </div>
      </header>

      <AtalhosRapidos />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        <div className="flex flex-col gap-4 lg:col-span-2 lg:gap-6">
          <Suspense
            fallback={<DashboardCardSkeleton title="Agenda do dia" rows={4} />}
          >
            <AgendaDoDiaSection />
          </Suspense>
          <Suspense
            fallback={
              <DashboardCardSkeleton title="Confirmações pendentes" rows={3} />
            }
          >
            <ConfirmacoesPendentesSection />
          </Suspense>
        </div>

        <div className="flex flex-col gap-4 lg:gap-6">
          <NotificacoesCard />
          <Suspense
            fallback={
              <DashboardCardSkeleton title="Status da assinatura" rows={2} />
            }
          >
            <StatusAssinaturaSection />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
