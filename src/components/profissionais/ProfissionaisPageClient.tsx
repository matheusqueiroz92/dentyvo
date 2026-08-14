"use client";

import { UserPlus } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import {
  listarEquipeAction,
  removerMembroAction,
  revogarSessoesDoMembroAction,
} from "@/actions/profissionais";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { EquipeInicial } from "@/lib/profissionais/carregar-equipe";
import type {
  LinhaEquipeDTO,
  MembroEquipeDTO,
} from "@/lib/profissionais/types";

import { ConvidarUsuarioModal } from "./ConvidarUsuarioModal";
import { EditarPapelModal } from "./EditarPapelModal";
import { ProfissionaisTable } from "./ProfissionaisTable";

type ProfissionaisPageClientProps = {
  iniciais: EquipeInicial;
};

export function ProfissionaisPageClient({
  iniciais,
}: ProfissionaisPageClientProps) {
  const [linhas, setLinhas] = useState<LinhaEquipeDTO[]>(iniciais.linhas);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [convidarAberto, setConvidarAberto] = useState(false);
  const [membroPapel, setMembroPapel] = useState<MembroEquipeDTO | null>(null);
  const [membroRemover, setMembroRemover] = useState<MembroEquipeDTO | null>(
    null,
  );
  const [membroRevogar, setMembroRevogar] = useState<MembroEquipeDTO | null>(
    null,
  );
  const [busyAcao, setBusyAcao] = useState(false);

  const podeGerenciar = iniciais.papel === "admin";

  const recarregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    const result = await listarEquipeAction();
    setCarregando(false);
    if (result.serverError || !result.data) {
      setErro(
        result.serverError?.mensagem ??
          "Não foi possível carregar a equipe.",
      );
      return;
    }
    setLinhas(result.data.linhas);
  }, []);

  async function confirmarRemocao() {
    if (!membroRemover) return;
    setBusyAcao(true);
    const result = await removerMembroAction({
      profissionalId: membroRemover.id,
    });
    setBusyAcao(false);
    if (result.serverError) {
      toast.error(
        result.serverError.mensagem ?? "Não foi possível remover o membro.",
      );
      return;
    }
    toast.success("Membro removido da clínica.");
    setLinhas((prev) => prev.filter((l) => l.id !== membroRemover.id));
    setMembroRemover(null);
  }

  async function confirmarRevogacao() {
    if (!membroRevogar) return;
    setBusyAcao(true);
    const result = await revogarSessoesDoMembroAction({
      profissionalId: membroRevogar.id,
    });
    setBusyAcao(false);
    if (result.serverError) {
      toast.error(
        result.serverError.mensagem ??
          "Não foi possível desconectar as sessões.",
      );
      return;
    }
    toast.success("Sessões encerradas em todos os dispositivos.");
    setMembroRevogar(null);
  }

  return (
    <main className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl leading-[38px] font-bold tracking-tight text-foreground">
            Profissionais
          </h1>
          <p className="mt-1 text-sm leading-[22px] text-muted-foreground">
            Equipe da clínica: membros ativos e convites pendentes.
          </p>
        </div>
        {podeGerenciar ? (
          <Button
            type="button"
            variant="primary"
            className="min-h-11"
            onClick={() => setConvidarAberto(true)}
          >
            <UserPlus aria-hidden />
            Convidar
          </Button>
        ) : null}
      </header>

      <ProfissionaisTable
        linhas={linhas}
        carregando={carregando}
        erro={erro}
        onRetry={() => void recarregar()}
        onConvidar={() => setConvidarAberto(true)}
        podeGerenciar={podeGerenciar}
        onAlterarPapel={setMembroPapel}
        onRemover={setMembroRemover}
        onRevogarSessoes={setMembroRevogar}
      />

      {podeGerenciar ? (
        <>
          <ConvidarUsuarioModal
            open={convidarAberto}
            onOpenChange={setConvidarAberto}
            onConvidado={(convite) => {
              setLinhas((prev) => {
                if (prev.some((l) => l.id === convite.id)) return prev;
                return [convite, ...prev];
              });
            }}
          />

          <EditarPapelModal
            open={membroPapel !== null}
            onOpenChange={(open) => {
              if (!open) setMembroPapel(null);
            }}
            membro={membroPapel}
            onAtualizado={(atualizado) => {
              setLinhas((prev) =>
                prev.map((l) => (l.id === atualizado.id ? atualizado : l)),
              );
            }}
          />

          <AlertDialog
            open={membroRemover !== null}
            onOpenChange={(open) => {
              if (!open) setMembroRemover(null);
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remover este membro?</AlertDialogTitle>
                <AlertDialogDescription>
                  {membroRemover
                    ? `${membroRemover.nome} perderá o acesso à clínica imediatamente. Agendamentos e registros clínicos já feitos permanecem; a pessoa não poderá mais entrar com esta conta.`
                    : "O membro perderá o acesso à clínica."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="min-h-11" disabled={busyAcao}>
                  Manter membro
                </AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  className="min-h-11"
                  disabled={busyAcao}
                  onClick={(e) => {
                    e.preventDefault();
                    void confirmarRemocao();
                  }}
                >
                  {busyAcao ? "Removendo…" : "Remover membro"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog
            open={membroRevogar !== null}
            onOpenChange={(open) => {
              if (!open) setMembroRevogar(null);
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Desconectar de todos os dispositivos?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {membroRevogar
                    ? `Todas as sessões ativas de ${membroRevogar.nome} serão encerradas. A pessoa precisará entrar de novo com e-mail e senha.`
                    : "Todas as sessões ativas serão encerradas."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="min-h-11" disabled={busyAcao}>
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  className="min-h-11"
                  disabled={busyAcao}
                  onClick={(e) => {
                    e.preventDefault();
                    void confirmarRevogacao();
                  }}
                >
                  {busyAcao ? "Desconectando…" : "Desconectar"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : null}
    </main>
  );
}
