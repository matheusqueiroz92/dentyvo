import { describe, expect, it, vi } from "vitest";

import {
  DadosInvalidosError,
  PerfilProprioDessincronizadoError,
  PerfilProprioNaoAutorizadoError,
} from "../../domain/errors";
import type { Papel } from "../../domain/Papel";
import { Profissional } from "../../domain/Profissional";
import {
  FakeAuthPort,
  FakeProfissionalRepository,
} from "../test-doubles/fakes";
import { AtualizarPerfilProprio } from "./AtualizarPerfilProprio";

async function seed(papel: Papel = "dentista") {
  const profissionalRepo = new FakeProfissionalRepository();
  const auth = new FakeAuthPort();

  const usuario = await auth.criarUsuario({
    nome: "Dr. Carlos",
    email: `${papel}@c.com`,
    senha: "s",
  });
  const profissional = Profissional.criar({
    id: `prof-${papel}`,
    clinicaId: "clinica-1",
    usuarioId: usuario.id,
    nome: "Dr. Carlos",
    papel,
    cro: papel === "dentista" ? "12345" : null,
    especialidade: papel === "dentista" ? "Endodontia" : null,
    slug: "carlos-endo",
  });
  await profissionalRepo.salvar(profissional);

  auth.definirSessao({
    usuarioId: usuario.id,
    clinicaId: "clinica-1",
    papel,
    profissionalId: profissional.id,
  });

  const sut = new AtualizarPerfilProprio(profissionalRepo, auth);
  return { sut, profissionalRepo, auth, usuario, profissional };
}

describe("AtualizarPerfilProprio", () => {
  it.each(["admin", "dentista", "recepcao"] as const)(
    "%s atualiza o próprio nome nas duas escritas, AuthPort antes do profissional",
    async (papel) => {
      const { sut, auth, usuario, profissionalRepo, profissional } =
        await seed(papel);
      const ordem: string[] = [];
      const atualizarNomeAuth = auth.atualizarNome.bind(auth);
      const atualizarParcial = profissionalRepo.atualizarParcial.bind(
        profissionalRepo,
      );

      auth.atualizarNome = async (usuarioId, nome) => {
        ordem.push("auth.atualizarNome");
        return atualizarNomeAuth(usuarioId, nome);
      };
      profissionalRepo.atualizarParcial = async (input) => {
        ordem.push("profissional.atualizarParcial");
        return atualizarParcial(input);
      };

      const atualizado = await sut.executar({
        usuarioId: usuario.id,
        nome: "  Maria Silva  ",
      });

      expect(atualizado.nome).toBe("Maria Silva");
      expect(atualizado.slug).toBe("carlos-endo");
      expect(atualizado.papel).toBe(papel);
      expect(atualizado.cro).toBe(papel === "dentista" ? "12345" : null);
      expect(auth.usuarios.get(usuario.id)?.nome).toBe("Maria Silva");
      expect(
        (await profissionalRepo.buscarPorId("clinica-1", profissional.id))
          ?.nome,
      ).toBe("Maria Silva");
      expect(ordem).toEqual([
        "auth.atualizarNome",
        "profissional.atualizarParcial",
      ]);
    },
  );

  it("não tenta persistir o profissional quando o AuthPort falha", async () => {
    const { sut, auth, usuario, profissionalRepo, profissional } =
      await seed();
    const atualizarParcial = vi.fn(profissionalRepo.atualizarParcial);

    auth.atualizarNome = async () => {
      throw new Error("BetterAuth indisponível");
    };
    profissionalRepo.atualizarParcial = atualizarParcial;

    await expect(
      sut.executar({ usuarioId: usuario.id, nome: "Maria Silva" }),
    ).rejects.toThrow("BetterAuth indisponível");

    expect(atualizarParcial).not.toHaveBeenCalled();
    expect(auth.usuarios.get(usuario.id)?.nome).toBe("Dr. Carlos");
    expect(
      (await profissionalRepo.buscarPorId("clinica-1", profissional.id))?.nome,
    ).toBe("Dr. Carlos");
  });

  it("compensa o AuthPort e não conclui com sucesso se persistir o profissional falhar", async () => {
    const { sut, auth, usuario, profissionalRepo, profissional } =
      await seed();
    const ordem: string[] = [];
    const atualizarNomeAuth = auth.atualizarNome.bind(auth);

    auth.atualizarNome = async (usuarioId, nome) => {
      ordem.push(`auth:${nome}`);
      return atualizarNomeAuth(usuarioId, nome);
    };
    profissionalRepo.atualizarParcial = async () => {
      ordem.push("profissional.atualizarParcial");
      throw new Error("falha ao persistir profissional");
    };

    await expect(
      sut.executar({ usuarioId: usuario.id, nome: "Maria Silva" }),
    ).rejects.toThrow("falha ao persistir profissional");

    expect(ordem).toEqual([
      "auth:Maria Silva",
      "profissional.atualizarParcial",
      "auth:Dr. Carlos",
    ]);
    expect(auth.usuarios.get(usuario.id)?.nome).toBe("Dr. Carlos");
    expect(
      (await profissionalRepo.buscarPorId("clinica-1", profissional.id))?.nome,
    ).toBe("Dr. Carlos");
  });

  it("lança PerfilProprioDessincronizadoError quando a compensação também falha", async () => {
    const { sut, auth, usuario, profissionalRepo, profissional } =
      await seed();
    const atualizarNomeAuth = auth.atualizarNome.bind(auth);
    let chamadasAuth = 0;

    auth.atualizarNome = async (usuarioId, nome) => {
      chamadasAuth += 1;
      if (chamadasAuth === 1) {
        return atualizarNomeAuth(usuarioId, nome);
      }
      throw new Error("compensação falhou");
    };
    profissionalRepo.atualizarParcial = async () => {
      throw new Error("falha ao persistir profissional");
    };

    await expect(
      sut.executar({ usuarioId: usuario.id, nome: "Maria Silva" }),
    ).rejects.toBeInstanceOf(PerfilProprioDessincronizadoError);

    expect(auth.usuarios.get(usuario.id)?.nome).toBe("Maria Silva");
    expect(
      (await profissionalRepo.buscarPorId("clinica-1", profissional.id))?.nome,
    ).toBe("Dr. Carlos");
  });

  it("rejeita atualizar o perfil de outro usuário sem chamar portas de escrita", async () => {
    const { sut, auth, usuario, profissionalRepo } = await seed("admin");
    const outro = await auth.criarUsuario({
      nome: "Outro",
      email: "outro@c.com",
      senha: "s",
    });
    await profissionalRepo.salvar(
      Profissional.criar({
        id: "prof-outro",
        clinicaId: "clinica-1",
        usuarioId: outro.id,
        nome: "Outro",
        papel: "recepcao",
      }),
    );

    const atualizarNome = vi.fn(auth.atualizarNome.bind(auth));
    const atualizarParcial = vi.fn(
      profissionalRepo.atualizarParcial.bind(profissionalRepo),
    );
    auth.atualizarNome = atualizarNome;
    profissionalRepo.atualizarParcial = atualizarParcial;

    await expect(
      sut.executar({ usuarioId: outro.id, nome: "Nome Invadido" }),
    ).rejects.toBeInstanceOf(PerfilProprioNaoAutorizadoError);

    expect(atualizarNome).not.toHaveBeenCalled();
    expect(atualizarParcial).not.toHaveBeenCalled();
    expect(auth.usuarios.get(outro.id)?.nome).toBe("Outro");
    expect(auth.usuarios.get(usuario.id)?.nome).toBe("Dr. Carlos");
  });

  it("rejeita nome vazio ou só espaços antes de qualquer I/O", async () => {
    const { sut, auth, usuario, profissionalRepo } = await seed();
    const obterSessao = vi.fn(auth.obterContextoSessao.bind(auth));
    const buscar = vi.fn(profissionalRepo.buscarPorUsuarioId.bind(profissionalRepo));
    const atualizarNome = vi.fn(auth.atualizarNome.bind(auth));
    const atualizarParcial = vi.fn(
      profissionalRepo.atualizarParcial.bind(profissionalRepo),
    );
    auth.obterContextoSessao = obterSessao;
    profissionalRepo.buscarPorUsuarioId = buscar;
    auth.atualizarNome = atualizarNome;
    profissionalRepo.atualizarParcial = atualizarParcial;

    await expect(
      sut.executar({ usuarioId: usuario.id, nome: "   " }),
    ).rejects.toBeInstanceOf(DadosInvalidosError);

    expect(obterSessao).not.toHaveBeenCalled();
    expect(buscar).not.toHaveBeenCalled();
    expect(atualizarNome).not.toHaveBeenCalled();
    expect(atualizarParcial).not.toHaveBeenCalled();
  });
});
