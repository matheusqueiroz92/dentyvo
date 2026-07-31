"use client";

import { CalendarPlus, UserPlus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function AtalhosRapidos() {
  const [toast, setToast] = useState<string | null>(null);

  function emBreve(destino: string) {
    setToast(`${destino} em breve.`);
    window.setTimeout(() => setToast(null), 4000);
  }

  return (
    <section aria-labelledby="atalhos-rapidos-titulo" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="atalhos-rapidos-titulo"
          className="text-base font-semibold text-foreground"
        >
          Atalhos rápidos
        </h2>
        {toast ? (
          <p
            role="status"
            className="text-[13px] text-muted-foreground"
            aria-live="polite"
          >
            {toast}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="primary"
          className="min-h-11"
          onClick={() => emBreve("Nova consulta")}
        >
          <CalendarPlus aria-hidden />
          Nova consulta
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          onClick={() => emBreve("Novo paciente")}
        >
          <UserPlus aria-hidden />
          Novo paciente
        </Button>
      </div>
    </section>
  );
}
