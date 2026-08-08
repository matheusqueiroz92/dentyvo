/** Dispara download de PDF a partir de base64 (retorno de server action). */
export function baixarPdfBase64(
  pdfBase64: string,
  nomeArquivo: string,
  contentType: string,
): void {
  const binario = atob(pdfBase64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i += 1) {
    bytes[i] = binario.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
