import type { UsuarioPlataforma } from "../../domain/UsuarioPlataforma";
import type { UsuarioPlataformaRepositoryPort } from "../ports/UsuarioPlataformaRepositoryPort";

export class FakeUsuarioPlataformaRepository
  implements UsuarioPlataformaRepositoryPort
{
  readonly items = new Map<string, UsuarioPlataforma>();

  async salvar(usuario: UsuarioPlataforma): Promise<void> {
    this.items.set(usuario.id, usuario);
  }

  async buscarPorId(id: string): Promise<UsuarioPlataforma | null> {
    return this.items.get(id) ?? null;
  }

  async buscarPorEmail(email: string): Promise<UsuarioPlataforma | null> {
    const normalizado = email.trim().toLowerCase();
    return (
      [...this.items.values()].find((u) => u.email === normalizado) ?? null
    );
  }
}
