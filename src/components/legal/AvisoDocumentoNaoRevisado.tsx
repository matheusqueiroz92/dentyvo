import { TriangleAlertIcon } from "lucide-react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

/**
 * Aviso bloqueante pré-lançamento: permanece até revisão jurídica LGPD/saúde.
 * Ver specs/00-overview.md — itens pré-lançamento.
 */
export function AvisoDocumentoNaoRevisado() {
  return (
    <Alert variant="warning" className="mb-8">
      <TriangleAlertIcon aria-hidden />
      <AlertTitle>Documento não revisado juridicamente</AlertTitle>
      <AlertDescription>
        Este documento é um modelo estrutural e AINDA NÃO foi revisado por
        profissional jurídico especializado em LGPD/saúde. Não representa
        aconselhamento jurídico. Deve ser validado antes do lançamento
        comercial.
      </AlertDescription>
    </Alert>
  );
}
