import {
  FakeAuthPort,
  FakeClinicaRepository,
  FakeProfissionalRepository,
  CPF_VALIDO,
} from "@/core/auth/application/test-doubles/fakes";
import { Clinica } from "@/core/auth/domain/Clinica";
import { DocumentoFiscal } from "@/core/auth/domain/DocumentoFiscal";
import { Profissional } from "@/core/auth/domain/Profissional";
import {
  FakeAuditoriaLogPort,
  FakeProntuarioRepository,
} from "@/core/prontuario/application/test-doubles/fakes";
import { Prontuario } from "@/core/prontuario/domain/Prontuario";

import { UsuarioPlataforma } from "../../domain/UsuarioPlataforma";
import { FakeUsuarioPlataformaRepository } from "../test-doubles/fakes";

export const SUPER_ADMIN_ID = "plat-super-1";
export const CLINICA_ALVO_ID = "clinica-alvo";

export async function criarContextoAdminPlataforma() {
  const clinicaRepo = new FakeClinicaRepository();
  const profissionalRepo = new FakeProfissionalRepository();
  const usuarioPlataformaRepo = new FakeUsuarioPlataformaRepository();
  const auth = new FakeAuthPort();
  const auditoria = new FakeAuditoriaLogPort();
  const prontuarioRepo = new FakeProntuarioRepository();

  const superAdmin = UsuarioPlataforma.criar({
    id: SUPER_ADMIN_ID,
    nome: "Dono Dentyvo",
    email: "dono@dentyvo.com",
  });
  await usuarioPlataformaRepo.salvar(superAdmin);

  const clinica = Clinica.criar({
    id: CLINICA_ALVO_ID,
    nome: "Clínica Alvo",
    endereco: "Rua A, 1",
    documento: DocumentoFiscal.criar("cpf", CPF_VALIDO),
  });
  await clinicaRepo.salvar(clinica);

  const membroUser = await auth.criarUsuario({
    nome: "Membro Alvo",
    email: "membro@alvo.com",
    senha: "senha-atual",
  });
  const membro = Profissional.criar({
    id: "prof-membro",
    clinicaId: CLINICA_ALVO_ID,
    usuarioId: membroUser.id,
    nome: "Membro Alvo",
    papel: "recepcao",
  });
  await profissionalRepo.salvar(membro);

  const adminClinicaUser = await auth.criarUsuario({
    nome: "Admin Clínica",
    email: "admin@alvo.com",
    senha: "senha-admin",
  });
  await profissionalRepo.salvar(
    Profissional.criar({
      id: "prof-admin-clinica",
      clinicaId: CLINICA_ALVO_ID,
      usuarioId: adminClinicaUser.id,
      nome: "Admin Clínica",
      papel: "admin",
    }),
  );

  const prontuario = Prontuario.criar({
    id: "pront-1",
    clinicaId: CLINICA_ALVO_ID,
    pacienteId: "pac-1",
  });
  await prontuarioRepo.salvar(prontuario);

  return {
    clinicaRepo,
    profissionalRepo,
    usuarioPlataformaRepo,
    auth,
    auditoria,
    prontuarioRepo,
    superAdmin,
    clinica,
    membro,
    membroUser,
    adminClinicaUser,
    prontuario,
  };
}
