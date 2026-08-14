import type { StatusClinica } from "@/core/auth/domain/Clinica";
import type { TipoDocumentoFiscal } from "@/core/auth/domain/DocumentoFiscal";
import type { TemaClinica } from "@/core/auth/domain/TemaClinica";

export type ClinicaGeralDTO = {
  id: string;
  nome: string;
  endereco: string;
  status: StatusClinica;
  tema: TemaClinica | null;
  documento: {
    tipo: TipoDocumentoFiscal;
    valor: string;
  };
};
