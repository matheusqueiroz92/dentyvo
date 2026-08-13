import type { Clinica } from "../../domain/Clinica";
import { ClinicaNaoEncontradaError } from "../../domain/errors";
import type { ClinicaRepositoryPort } from "../ports/ClinicaRepositoryPort";
import type { ProfissionalRepositoryPort } from "../ports/ProfissionalRepositoryPort";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";

/**
 * Input de `AtualizarClinica` (spec 001 — emenda).
 * Documento fiscal **não** existe neste tipo (imutável / identidade do tenant).
 * Pelo menos um de `nome` / `endereco` é obrigatório (invariante de domínio).
 */
export type AtualizarClinicaInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
  nome?: string;
  endereco?: string;
};

/**
 * Admin atualiza nome e/ou endereço da própria clínica.
 * RBAC: `editar_clinica` (matriz 001 — só `admin`), via `shared/autorizacao`.
 */
export class AtualizarClinica {
  constructor(
    private readonly clinicaRepo: ClinicaRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
  ) {}

  async executar(input: AtualizarClinicaInput): Promise<Clinica> {
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "editar_clinica");

    const clinica = await this.clinicaRepo.buscarPorId(input.clinicaId);
    if (!clinica) {
      throw new ClinicaNaoEncontradaError(input.clinicaId);
    }

    const atualizada = clinica.atualizarDadosCadastrais({
      nome: input.nome,
      endereco: input.endereco,
    });
    await this.clinicaRepo.salvar(atualizada);
    return atualizada;
  }
}
