import type { StatusClinica } from "@/core/auth/domain/Clinica";
import type { TipoDocumentoFiscal } from "@/core/auth/domain/DocumentoFiscal";

export type ClinicaGeralDTO = {
  id: string;
  nome: string;
  endereco: string;
  status: StatusClinica;
  documento: {
    tipo: TipoDocumentoFiscal;
    valor: string;
  };
};
