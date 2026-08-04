"use client";

import { useEffect, useState, useTransition } from "react";
import Script from "next/script";

import {
  listarHorariosPublicosAction,
  marcarConsultaPublicaAction,
  resolverContextoPublicoAction,
} from "@/actions/agendamento-publico";

type Resumo = {
  clinica: { nome: string; slug: string; logoUrl: string | null };
  profissionais: Array<{ id: string; nome: string; slug: string }>;
  menu: Array<{ rotuloPublico: string; procedimentoId: string }>;
};

type Props = {
  slugClinica: string;
  slugProfissional?: string;
};

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: string | HTMLElement,
        opts: { sitekey: string; callback: (token: string) => void },
      ) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

export function AgendarPublicoClient({
  slugClinica,
  slugProfissional,
}: Props) {
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [profissionalId, setProfissionalId] = useState<string>("");
  const [procedimentoId, setProcedimentoId] = useState<string>("");
  const [horarios, setHorarios] = useState<
    Array<{ inicioIso: string; fimIso: string }>
  >([]);
  const [dataIso, setDataIso] = useState(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d.toISOString();
  });
  const [inicioIso, setInicioIso] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("1990-01-01");
  const [aceite, setAceite] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    startTransition(async () => {
      const result = await resolverContextoPublicoAction({
        slugClinica,
        slugProfissional,
      });
      if (result.serverError) {
        setErro(result.serverError.mensagem);
        return;
      }
      const data = result.data;
      if (!data) {
        setErro("Não foi possível carregar a clínica.");
        return;
      }
      setResumo(data.resumo);
      const profs = data.resumo.profissionais;
      if (profs.length === 1 && profs[0]) {
        setProfissionalId(profs[0].id);
      }
      if (data.resumo.menu[0]) {
        setProcedimentoId(data.resumo.menu[0].procedimentoId);
      }
    });
  }, [slugClinica, slugProfissional]);

  useEffect(() => {
    if (!profissionalId || !resumo) return;
    startTransition(async () => {
      const result = await listarHorariosPublicosAction({
        slugClinica,
        slugProfissional,
        profissionalId,
        dataIso,
      });
      if (result.serverError) {
        setErro(result.serverError.mensagem);
        return;
      }
      setHorarios(result.data?.horarios ?? []);
    });
  }, [profissionalId, dataIso, slugClinica, slugProfissional, resumo]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSucesso(null);
    startTransition(async () => {
      const nasc = new Date(`${dataNascimento}T12:00:00.000Z`);
      const result = await marcarConsultaPublicaAction({
        slugClinica,
        slugProfissional,
        nome,
        telefone,
        cpf,
        dataNascimentoIso: nasc.toISOString(),
        procedimentoId,
        profissionalId,
        dataHoraInicioIso: inicioIso,
        aceiteComunicacaoLembretes: true as const,
        captchaToken: captchaToken || "bypass",
      });
      if (result.serverError) {
        setErro(result.serverError.mensagem);
        return;
      }
      setSucesso(
        `Solicitação registrada (${result.data?.status}). A clínica confirmará o horário.`,
      );
    });
  }

  if (erro && !resumo) {
    return (
      <main className="mx-auto max-w-lg px-4 py-12 text-foreground">
        <p role="alert" className="text-destructive">
          {erro}
        </p>
      </main>
    );
  }

  if (!resumo) {
    return (
      <main className="mx-auto max-w-lg px-4 py-12 text-muted-foreground">
        Carregando agenda…
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg space-y-6 px-4 py-10 text-foreground">
      {siteKey ? (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          async
          defer
        />
      ) : null}

      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {resumo.clinica.nome}
        </h1>
        <p className="text-sm text-muted-foreground">
          Agende sua consulta pelo link público
        </p>
      </header>

      {erro ? (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      ) : null}
      {sucesso ? (
        <p role="status" className="text-sm text-success">
          {sucesso}
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4">
        {!slugProfissional && resumo.profissionais.length > 1 ? (
          <label className="block space-y-1 text-sm">
            <span>Profissional</span>
            <select
              className="min-h-11 w-full rounded-md border border-border bg-background px-3"
              value={profissionalId}
              onChange={(e) => setProfissionalId(e.target.value)}
              required
            >
              <option value="">Selecione</option>
              {resumo.profissionais.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="block space-y-1 text-sm">
          <span>Tipo de atendimento</span>
          <select
            className="min-h-11 w-full rounded-md border border-border bg-background px-3"
            value={procedimentoId}
            onChange={(e) => setProcedimentoId(e.target.value)}
            required
          >
            {resumo.menu.map((item) => (
              <option key={item.procedimentoId} value={item.procedimentoId}>
                {item.rotuloPublico}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1 text-sm">
          <span>Data</span>
          <input
            type="date"
            className="min-h-11 w-full rounded-md border border-border bg-background px-3 tabular-nums"
            value={dataIso.slice(0, 10)}
            onChange={(e) => {
              const d = new Date(`${e.target.value}T12:00:00.000Z`);
              setDataIso(d.toISOString());
              setInicioIso("");
            }}
            required
          />
        </label>

        <fieldset className="space-y-2">
          <legend className="text-sm">Horário disponível</legend>
          {horarios.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum horário livre nesta data.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {horarios.map((h) => {
                const label = new Intl.DateTimeFormat("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "America/Sao_Paulo",
                }).format(new Date(h.inicioIso));
                return (
                  <button
                    key={h.inicioIso}
                    type="button"
                    className={`min-h-11 rounded-md border px-2 text-sm tabular-nums ${
                      inicioIso === h.inicioIso
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border"
                    }`}
                    onClick={() => setInicioIso(h.inicioIso)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </fieldset>

        <label className="block space-y-1 text-sm">
          <span>Nome</span>
          <input
            className="min-h-11 w-full rounded-md border border-border bg-background px-3"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Telefone</span>
          <input
            className="min-h-11 w-full rounded-md border border-border bg-background px-3 tabular-nums"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            required
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>CPF</span>
          <input
            className="min-h-11 w-full rounded-md border border-border bg-background px-3 tabular-nums"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            required
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Data de nascimento</span>
          <input
            type="date"
            className="min-h-11 w-full rounded-md border border-border bg-background px-3 tabular-nums"
            value={dataNascimento}
            onChange={(e) => setDataNascimento(e.target.value)}
            required
          />
        </label>

        <label className="flex min-h-11 items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={aceite}
            onChange={(e) => setAceite(e.target.checked)}
            required
          />
          <span>
            Aceito receber lembretes da consulta (WhatsApp/notificação).
          </span>
        </label>

        {siteKey ? (
          <div
            className="cf-turnstile"
            data-sitekey={siteKey}
            ref={(el) => {
              if (!el || !window.turnstile || captchaToken) return;
              window.turnstile.render(el, {
                sitekey: siteKey,
                callback: (token) => setCaptchaToken(token),
              });
            }}
          />
        ) : (
          <p className="text-xs text-muted-foreground">
            CAPTCHA em modo bypass (defina NEXT_PUBLIC_TURNSTILE_SITE_KEY e
            TURNSTILE_SECRET_KEY em produção).
          </p>
        )}

        <button
          type="submit"
          disabled={pending || !inicioIso || !aceite}
          className="min-h-11 w-full rounded-md bg-primary px-4 text-primary-foreground disabled:opacity-50"
        >
          {pending ? "Enviando…" : "Solicitar agendamento"}
        </button>
      </form>
    </main>
  );
}
