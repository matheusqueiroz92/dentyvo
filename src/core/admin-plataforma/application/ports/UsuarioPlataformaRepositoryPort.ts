import type { UsuarioPlataforma } from "../../domain/UsuarioPlataforma";

export interface UsuarioPlataformaRepositoryPort {
  salvar(usuario: UsuarioPlataforma): Promise<void>;
  buscarPorId(id: string): Promise<UsuarioPlataforma | null>;
  buscarPorEmail(email: string): Promise<UsuarioPlataforma | null>;
}
