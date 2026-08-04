"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { CalendarCheck2, Loader2 } from "lucide-react";

import {
  listarHorariosPublicosAction,
  marcarConsultaPublicaAction,
  resolverContextoPublicoAction,
} from "@/actions/agendamento-publico";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { iniciaisDoNome } from "@/lib/iniciais";
import { mascararCpfInput } from "@/lib/pacientes/cpf";
import { cn } from "@/lib/utils";

import { LinkPublicoIndisponivel } from "./LinkPublicoIndisponivel";
import { PublicoClinicaShell, PublicoFallbackShell } from "./PublicoClinicaShell";
import {
  pacientePublicoFormSchema,
  type PacientePublicoFormValues,
} from "./schema-paciente-publico";
import {
  StepperPublico,
  type EtapaPublicaId,
} from "./StepperPublico";

type Resumo = {
  clinica: {
    id: string;
    nome: string;
    slug: string;
    logoUrl: string | null;
    tema: string | null;
  };
  profissionais: Array<{ id: string; nome: string; slug: string }>;
  menu: Array<{ rotuloPublico: string; procedimentoId: string }>;
};

type Props = {
  slugClinica: string;
  slugProfissional?: string;
};

function dataMeioDiaIso(dateYmd: string): string {
  return new Date(`${dateYmd}T12:00:00.000Z`).toISOString();
}

function hojeYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function adicionarDiasYmd(ymd: string, dias: number): string {
  const d = new Date(`${ymd}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

function formatarHora(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}

function formatarDataCurta(ymd: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${ymd}T12:00:00.000Z`));
}

export function AgendarPublicoFlow({
  slugClinica,
  slugProfissional,
}: Props) {
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [indisponivel, setIndisponivel] = useState(false);
  const [erroCarga, setErroCarga] = useState<string | null>(null);
  const [profissionalId, setProfissionalId] = useState("");
  const [procedimentoId, setProcedimentoId] = useState("");
  const [dataYmd, setDataYmd] = useState(hojeYmd);
  const [horarios, setHorarios] = useState<
    Array<{ inicioIso: string; fimIso: string }>
  >([]);
  const [inicioIso, setInicioIso] = useState("");
  const [buscandoHorarios, setBuscandoHorarios] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [erroSubmit, setErroSubmit] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [pending, startTransition] = useTransition();
  const [etapa, setEtapa] = useState<EtapaPublicaId>("profissional");

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const bypassCaptcha = !siteKey;

  const form = useForm<PacientePublicoFormValues>({
    resolver: zodResolver(pacientePublicoFormSchema),
    defaultValues: {
      nome: "",
      cpf: "",
      telefone: "",
      dataNascimento: "",
      aceiteComunicacaoLembretes: false,
    },
  });
  const aceiteLembretes = useWatch({
    control: form.control,
    name: "aceiteComunicacaoLembretes",
  });

  const pularProfissional = Boolean(
    slugProfissional || (resumo && resumo.profissionais.length <= 1),
  );
  const pularProcedimento = Boolean(resumo && resumo.menu.length <= 1);

  const etapasVisiveis = useMemo((): EtapaPublicaId[] => {
    const todas: EtapaPublicaId[] = [];
    if (!pularProfissional) todas.push("profissional");
    if (!pularProcedimento) todas.push("procedimento");
    todas.push("horario", "dados", "confirmacao");
    return todas;
  }, [pularProfissional, pularProcedimento]);

  const carregarHorarios = useCallback(
    async (ymd: string, profId: string, autoAvancar = true) => {
      if (!profId) return;
      setBuscandoHorarios(true);
      setErroSubmit(null);
      try {
        let dia = ymd;
        for (let i = 0; i < 21; i++) {
          const result = await listarHorariosPublicosAction({
            slugClinica,
            slugProfissional,
            profissionalId: profId,
            dataIso: dataMeioDiaIso(dia),
          });
          if (result.serverError) {
            setErroSubmit(result.serverError.mensagem);
            setHorarios([]);
            return;
          }
          const lista = result.data?.horarios ?? [];
          if (lista.length > 0) {
            if (dia !== ymd && autoAvancar) {
              setDataYmd(dia);
            }
            setHorarios(lista);
            return;
          }
          if (!autoAvancar) {
            setHorarios([]);
            return;
          }
          dia = adicionarDiasYmd(dia, 1);
        }
        setHorarios([]);
      } finally {
        setBuscandoHorarios(false);
      }
    },
    [slugClinica, slugProfissional],
  );

  useEffect(() => {
    startTransition(async () => {
      const result = await resolverContextoPublicoAction({
        slugClinica,
        slugProfissional,
      });
      if (result.serverError) {
        setIndisponivel(true);
        setErroCarga(result.serverError.mensagem);
        return;
      }
      const data = result.data;
      if (!data) {
        setIndisponivel(true);
        return;
      }
      setResumo(data.resumo);
      const profs = data.resumo.profissionais;
      let profId = "";
      if (profs.length === 1 && profs[0]) {
        profId = profs[0].id;
        setProfissionalId(profs[0].id);
      } else if (data.contexto.profissionalPreResolvido && profs[0]) {
        profId = profs[0].id;
        setProfissionalId(profs[0].id);
      }
      if (data.resumo.menu.length === 1 && data.resumo.menu[0]) {
        setProcedimentoId(data.resumo.menu[0].procedimentoId);
      }

      let proxima: EtapaPublicaId = "profissional";
      if (data.contexto.profissionalPreResolvido || profs.length <= 1) {
        proxima = data.resumo.menu.length <= 1 ? "horario" : "procedimento";
      }
      setEtapa(proxima);
      if (proxima === "horario" && profId) {
        void carregarHorarios(hojeYmd(), profId, true);
      }
    });
  }, [slugClinica, slugProfissional, carregarHorarios]);

  function avancarDe(atual: EtapaPublicaId) {
    const i = etapasVisiveis.indexOf(atual);
    const prox = etapasVisiveis[i + 1];
    if (!prox) return;
    setEtapa(prox);
    if (prox === "horario" && profissionalId) {
      void carregarHorarios(dataYmd, profissionalId, true);
    }
  }

  function voltarDe(atual: EtapaPublicaId) {
    const i = etapasVisiveis.indexOf(atual);
    const ant = etapasVisiveis[i - 1];
    if (ant) setEtapa(ant);
  }

  async function onConfirmar(values: PacientePublicoFormValues) {
    setErroSubmit(null);
    const token = captchaToken || (bypassCaptcha ? "bypass" : "");
    if (!token) {
      setErroSubmit("Conclua a verificação de segurança antes de confirmar.");
      return;
    }

    startTransition(async () => {
      const nasc = new Date(`${values.dataNascimento}T12:00:00.000Z`);
      const result = await marcarConsultaPublicaAction({
        slugClinica,
        slugProfissional,
        nome: values.nome,
        telefone: values.telefone,
        cpf: values.cpf,
        dataNascimentoIso: nasc.toISOString(),
        procedimentoId,
        profissionalId,
        dataHoraInicioIso: inicioIso,
        aceiteComunicacaoLembretes: true as const,
        captchaToken: token,
      });

      if (result.serverError) {
        const codigo = result.serverError.codigo;
        if (codigo === "SobreposicaoHorarioError") {
          setErroSubmit(
            "Esse horário acabou de ser reservado. Escolha outro.",
          );
          setInicioIso("");
          setEtapa("horario");
          await carregarHorarios(dataYmd, profissionalId, false);
          return;
        }
        if (codigo === "CaptchaInvalidoError") {
          setErroSubmit(
            "Não foi possível validar a verificação de segurança. Tente novamente.",
          );
          setCaptchaToken("");
          return;
        }
        if (codigo === "RateLimitExcedidoError") {
          setErroSubmit(
            "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
          );
          return;
        }
        setErroSubmit(result.serverError.mensagem);
        return;
      }

      setSucesso(true);
    });
  }

  if (indisponivel) {
    return <LinkPublicoIndisponivel mensagem={erroCarga ?? undefined} />;
  }

  if (!resumo) {
    return (
      <PublicoFallbackShell>
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Carregando agenda…
        </div>
      </PublicoFallbackShell>
    );
  }

  if (sucesso) {
    return (
      <PublicoClinicaShell
        clinicaNome={resumo.clinica.nome}
        logoUrl={resumo.clinica.logoUrl}
        tema={resumo.clinica.tema}
      >
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-warning/15 text-warning">
            <CalendarCheck2 className="size-7" aria-hidden />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight">
              Solicitação enviada
            </h1>
            <p className="text-sm text-muted-foreground">
              Sua consulta foi{" "}
              <strong className="font-medium text-foreground">
                solicitada
              </strong>{" "}
              e está com status{" "}
              <strong className="font-medium text-warning">pendente</strong>,
              aguardando confirmação da clínica.
            </p>
            <p className="text-sm text-muted-foreground">
              Ela ainda <strong className="text-foreground">não está confirmada</strong>.
              A clínica entrará em contato para validar o horário.
            </p>
          </div>
        </div>
      </PublicoClinicaShell>
    );
  }

  const diasOpcoes = Array.from({ length: 14 }, (_, i) =>
    adicionarDiasYmd(hojeYmd(), i),
  );

  return (
    <PublicoClinicaShell
      clinicaNome={resumo.clinica.nome}
      logoUrl={resumo.clinica.logoUrl}
      tema={resumo.clinica.tema}
    >
      <StepperPublico etapas={etapasVisiveis} atual={etapa} />

      {erroSubmit ? (
        <p role="alert" className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {erroSubmit}
        </p>
      ) : null}

      {etapa === "profissional" ? (
        <section className="space-y-4" aria-labelledby="etapa-prof">
          <h2 id="etapa-prof" className="text-lg font-semibold">
            Escolha o profissional
          </h2>
          <ul className="space-y-2">
            {resumo.profissionais.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    setProfissionalId(p.id);
                    setInicioIso("");
                    avancarDe("profissional");
                  }}
                  className={cn(
                    "flex min-h-14 w-full items-center gap-3 rounded-lg border px-3 text-left transition-colors",
                    profissionalId === p.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/60",
                  )}
                >
                  <Avatar className="size-10">
                    <AvatarFallback className="text-xs">
                      {iniciaisDoNome(p.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{p.nome}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {etapa === "procedimento" ? (
        <section className="space-y-4" aria-labelledby="etapa-proc">
          <h2 id="etapa-proc" className="text-lg font-semibold">
            O que você precisa?
          </h2>
          <ul className="space-y-2">
            {resumo.menu.map((item) => (
              <li key={item.procedimentoId}>
                <button
                  type="button"
                  onClick={() => {
                    setProcedimentoId(item.procedimentoId);
                    avancarDe("procedimento");
                  }}
                  className={cn(
                    "flex min-h-14 w-full items-center rounded-lg border px-4 text-left text-sm font-medium transition-colors",
                    procedimentoId === item.procedimentoId
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/60",
                  )}
                >
                  {item.rotuloPublico}
                </button>
              </li>
            ))}
          </ul>
          {!pularProfissional ? (
            <Button type="button" variant="ghost" onClick={() => voltarDe("procedimento")}>
              Voltar
            </Button>
          ) : null}
        </section>
      ) : null}

      {etapa === "horario" ? (
        <section className="space-y-4" aria-labelledby="etapa-hora">
          <h2 id="etapa-hora" className="text-lg font-semibold">
            Escolha data e horário
          </h2>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {diasOpcoes.map((ymd) => (
              <button
                key={ymd}
                type="button"
                onClick={() => {
                  setDataYmd(ymd);
                  setInicioIso("");
                  void carregarHorarios(ymd, profissionalId, false);
                }}
                className={cn(
                  "min-h-14 min-w-[4.5rem] shrink-0 rounded-lg border px-2 py-2 text-center text-xs tabular-nums",
                  dataYmd === ymd
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border",
                )}
              >
                {formatarDataCurta(ymd)}
              </button>
            ))}
          </div>

          {buscandoHorarios ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Buscando horários…
            </p>
          ) : horarios.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum horário livre neste dia. Escolha outra data.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {horarios.map((h) => (
                <button
                  key={h.inicioIso}
                  type="button"
                  onClick={() => {
                    setInicioIso(h.inicioIso);
                    avancarDe("horario");
                  }}
                  className={cn(
                    "min-h-11 rounded-md border px-2 text-sm tabular-nums",
                    inicioIso === h.inicioIso
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-muted/60",
                  )}
                >
                  {formatarHora(h.inicioIso)}
                </button>
              ))}
            </div>
          )}

          <Button type="button" variant="ghost" onClick={() => voltarDe("horario")}>
            Voltar
          </Button>
        </section>
      ) : null}

      {etapa === "dados" ? (
        <section className="space-y-4" aria-labelledby="etapa-dados">
          <h2 id="etapa-dados" className="text-lg font-semibold">
            Seus dados
          </h2>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(() => avancarDe("dados"))}
          >
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome completo</Label>
              <Input
                id="nome"
                className="min-h-11"
                autoComplete="name"
                {...form.register("nome")}
                aria-invalid={Boolean(form.formState.errors.nome)}
              />
              {form.formState.errors.nome ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.nome.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                className="min-h-11 tabular-nums"
                inputMode="numeric"
                {...form.register("cpf", {
                  onChange: (e) => {
                    e.target.value = mascararCpfInput(e.target.value);
                  },
                })}
                aria-invalid={Boolean(form.formState.errors.cpf)}
              />
              {form.formState.errors.cpf ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.cpf.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="telefone">Telefone (WhatsApp)</Label>
              <Input
                id="telefone"
                className="min-h-11 tabular-nums"
                inputMode="tel"
                autoComplete="tel"
                {...form.register("telefone")}
                aria-invalid={Boolean(form.formState.errors.telefone)}
              />
              {form.formState.errors.telefone ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.telefone.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nasc">Data de nascimento</Label>
              <Input
                id="nasc"
                type="date"
                className="min-h-11 tabular-nums"
                {...form.register("dataNascimento")}
                aria-invalid={Boolean(form.formState.errors.dataNascimento)}
              />
              {form.formState.errors.dataNascimento ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.dataNascimento.message}
                </p>
              ) : null}
            </div>
            <label className="flex min-h-11 items-start gap-3 text-sm">
              <Checkbox
                checked={aceiteLembretes === true}
                onCheckedChange={(v) =>
                  form.setValue("aceiteComunicacaoLembretes", v === true, {
                    shouldValidate: true,
                  })
                }
                className="mt-1"
              />
              <span>
                Aceito receber lembretes da consulta (WhatsApp/notificação).
                {form.formState.errors.aceiteComunicacaoLembretes ? (
                  <span className="mt-1 block text-xs text-destructive">
                    {form.formState.errors.aceiteComunicacaoLembretes.message}
                  </span>
                ) : null}
              </span>
            </label>
            <p className="text-xs text-muted-foreground">
              Ao continuar, você concorda com os{" "}
              <Link href="/termos" className="underline underline-offset-2">
                Termos
              </Link>{" "}
              e a{" "}
              <Link href="/privacidade" className="underline underline-offset-2">
                Política de Privacidade
              </Link>
              .
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => voltarDe("dados")}>
                Voltar
              </Button>
              <Button type="submit" className="min-h-11 flex-1">
                Continuar
              </Button>
            </div>
          </form>
        </section>
      ) : null}

      {etapa === "confirmacao" ? (
        <section className="space-y-4" aria-labelledby="etapa-conf">
          <h2 id="etapa-conf" className="text-lg font-semibold">
            Confirmar agendamento
          </h2>
          <dl className="space-y-2 rounded-lg border border-border bg-card p-4 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Horário</dt>
              <dd className="tabular-nums font-medium">
                {inicioIso
                  ? `${formatarDataCurta(dataYmd)} · ${formatarHora(inicioIso)}`
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Nome</dt>
              <dd className="font-medium">{form.getValues("nome") || "—"}</dd>
            </div>
          </dl>

          {siteKey ? (
            <Turnstile
              siteKey={siteKey}
              onSuccess={(token) => setCaptchaToken(token)}
              onExpire={() => setCaptchaToken("")}
              options={{ theme: "light" }}
            />
          ) : (
            <p className="text-xs text-muted-foreground">
              Verificação em modo desenvolvimento (configure Turnstile em
              produção).
            </p>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => voltarDe("confirmacao")}
            >
              Voltar
            </Button>
            <Button
              type="button"
              className="min-h-11 flex-1"
              disabled={pending || !inicioIso}
              onClick={() => void form.handleSubmit(onConfirmar)()}
            >
              {pending ? "Enviando…" : "Confirmar agendamento"}
            </Button>
          </div>
        </section>
      ) : null}
    </PublicoClinicaShell>
  );
}
