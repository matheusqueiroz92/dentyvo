"use client";

import { Check, Copy, Link2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  atualizarSlugClinicaAction,
  atualizarSlugProfissionalAction,
  carregarConfigAgendamentoOnlineAction,
  configurarMenuPublicoAction,
} from "@/actions/configuracoes-agendamento-online";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  previewUrlPublica,
  urlPublicaAbsoluta,
} from "@/lib/agendamento-publico/url-publica";

type Dados = Awaited<
  NonNullable<
    Awaited<ReturnType<typeof carregarConfigAgendamentoOnlineAction>>["data"]
  >
>;

async function copiarPath(path: string) {
  const absolute = urlPublicaAbsoluta(
    path,
    typeof window !== "undefined" ? window.location.origin : undefined,
  );
  await navigator.clipboard.writeText(absolute);
  toast.success("Link copiado");
}

export function AbaAgendamentoOnline() {
  const [dados, setDados] = useState<Dados | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [slugClinica, setSlugClinica] = useState("");
  const [slugsProf, setSlugsProf] = useState<Record<string, string>>({});
  const [menuItens, setMenuItens] = useState<
    Array<{ rotuloPublico: string; procedimentoId: string }>
  >([]);
  const [pending, startTransition] = useTransition();
  useEffect(() => {
    let cancelado = false;
    startTransition(async () => {
      const result = await carregarConfigAgendamentoOnlineAction();
      if (cancelado) return;
      if (result.serverError) {
        setErro(result.serverError.mensagem);
        return;
      }
      if (!result.data) {
        setErro("Não foi possível carregar as configurações.");
        return;
      }
      setDados(result.data);
      setSlugClinica(result.data.clinica.slug);
      setSlugsProf(
        Object.fromEntries(
          result.data.profissionais.map((p) => [p.id, p.slug]),
        ),
      );
      setMenuItens(
        result.data.menu.length > 0
          ? result.data.menu
          : [
              { rotuloPublico: "Consulta/Avaliação", procedimentoId: "" },
              { rotuloPublico: "Limpeza", procedimentoId: "" },
            ],
      );
    });
    return () => {
      cancelado = true;
    };
  }, [startTransition]);

  function recarregar() {
    startTransition(async () => {
      const result = await carregarConfigAgendamentoOnlineAction();
      if (result.serverError) {
        toast.error(result.serverError.mensagem);
        return;
      }
      if (!result.data) return;
      setDados(result.data);
      setSlugClinica(result.data.clinica.slug);
      setSlugsProf(
        Object.fromEntries(
          result.data.profissionais.map((p) => [p.id, p.slug]),
        ),
      );
      setMenuItens(
        result.data.menu.length > 0
          ? result.data.menu
          : [
              { rotuloPublico: "Consulta/Avaliação", procedimentoId: "" },
              { rotuloPublico: "Limpeza", procedimentoId: "" },
            ],
      );
    });
  }

  if (erro && !dados) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {erro}
      </p>
    );
  }

  if (!dados) {
    return <p className="text-sm text-muted-foreground">Carregando…</p>;
  }

  if (dados.papel !== "admin") {
    return (
      <p className="text-sm text-muted-foreground">
        Apenas administradores podem configurar o agendamento online.
      </p>
    );
  }

  const pathClinica = `/agendar/${slugClinica || dados.clinica.slug}`;

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">Link da clínica</h2>
          <p className="text-sm text-muted-foreground">
            Alterar o slug invalida links já compartilhados (sem redirecionamento
            do endereço antigo).
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="slug-clinica">Slug da clínica</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="slug-clinica"
              className="min-h-11 tabular-nums"
              value={slugClinica}
              onChange={(e) => setSlugClinica(e.target.value)}
            />
            <Button
              type="button"
              className="min-h-11"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  const r = await atualizarSlugClinicaAction({
                    slug: slugClinica,
                  });
                  if (r.serverError) {
                    toast.error(r.serverError.mensagem);
                    return;
                  }
                  toast.success("Slug da clínica atualizado");
                  recarregar();
                });
              }}
            >
              Salvar slug
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
          <Link2 className="size-4 text-muted-foreground" aria-hidden />
          <code className="min-w-0 flex-1 truncate tabular-nums text-xs">
            {previewUrlPublica(pathClinica)}
          </code>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11"
            onClick={() => void copiarPath(pathClinica)}
          >
            <Copy className="size-4" aria-hidden />
            Copiar
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Links por profissional</h2>
        <ul className="space-y-4">
          {dados.profissionais.map((p) => {
            const slug = slugsProf[p.id] ?? p.slug;
            const pathProf = `/agendar/${dados.clinica.slug}/${slug}`;
            return (
              <li
                key={p.id}
                className="space-y-2 rounded-lg border border-border p-3"
              >
                <p className="text-sm font-medium">{p.nome}</p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    className="min-h-11 tabular-nums"
                    value={slug}
                    onChange={(e) =>
                      setSlugsProf((prev) => ({
                        ...prev,
                        [p.id]: e.target.value,
                      }))
                    }
                    aria-label={`Slug de ${p.nome}`}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    className="min-h-11"
                    disabled={pending}
                    onClick={() => {
                      startTransition(async () => {
                        const r = await atualizarSlugProfissionalAction({
                          profissionalId: p.id,
                          slug,
                        });
                        if (r.serverError) {
                          toast.error(r.serverError.mensagem);
                          return;
                        }
                        toast.success("Slug do profissional atualizado");
                        recarregar();
                      });
                    }}
                  >
                    Salvar
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <code className="min-w-0 flex-1 truncate tabular-nums">
                    {previewUrlPublica(pathProf)}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="min-h-11"
                    onClick={() => void copiarPath(pathProf)}
                  >
                    <Copy className="size-4" aria-hidden />
                    Copiar
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">Menu público</h2>
          <p className="text-sm text-muted-foreground">
            De 2 a 4 opções exibidas no link (rótulo + procedimento real).
          </p>
        </div>
        <ul className="space-y-3">
          {menuItens.map((item, idx) => (
            <li
              key={idx}
              className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[1fr_1fr_auto]"
            >
              <div className="space-y-1">
                <Label>Rótulo público</Label>
                <Input
                  className="min-h-11"
                  value={item.rotuloPublico}
                  onChange={(e) => {
                    const next = [...menuItens];
                    next[idx] = {
                      ...item,
                      rotuloPublico: e.target.value,
                    };
                    setMenuItens(next);
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label>Procedimento</Label>
                <select
                  className="min-h-11 w-full rounded-md border border-input bg-card px-3 text-sm"
                  value={item.procedimentoId}
                  onChange={(e) => {
                    const next = [...menuItens];
                    next[idx] = {
                      ...item,
                      procedimentoId: e.target.value,
                    };
                    setMenuItens(next);
                  }}
                >
                  <option value="">Selecione</option>
                  {dados.procedimentos.map((proc) => (
                    <option key={proc.id} value={proc.id}>
                      {proc.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="min-h-11 min-w-11"
                  disabled={menuItens.length <= 2}
                  onClick={() =>
                    setMenuItens(menuItens.filter((_, i) => i !== idx))
                  }
                  aria-label="Remover item"
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </div>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            disabled={menuItens.length >= 4}
            onClick={() =>
              setMenuItens([
                ...menuItens,
                { rotuloPublico: "", procedimentoId: "" },
              ])
            }
          >
            <Plus className="size-4" aria-hidden />
            Adicionar item
          </Button>
          <Button
            type="button"
            className="min-h-11"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                const r = await configurarMenuPublicoAction({
                  itens: menuItens,
                });
                if (r.serverError) {
                  toast.error(r.serverError.mensagem);
                  return;
                }
                toast.success("Menu público salvo");
                recarregar();
              });
            }}
          >
            <Check className="size-4" aria-hidden />
            Salvar menu
          </Button>
        </div>
      </section>
    </div>
  );
}
