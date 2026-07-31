"use client";

import { ImagePlus, X } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_BYTES = 2 * 1024 * 1024;
const TIPOS_ACEITOS = ["image/png", "image/jpeg", "image/webp"];

type LogoUploadFieldProps = {
  value: File | null;
  onChange: (file: File | null) => void;
  error?: string;
};

/**
 * Upload de logo com preview (DESIGN_SYSTEM: label + controle + erro).
 * O arquivo só sobe no submit da etapa 2 via BlobStorageAdapter.
 */
export function LogoUploadField({
  value,
  onChange,
  error,
}: LogoUploadFieldProps) {
  const inputId = useId();
  const [erroLocal, setErroLocal] = useState<string | null>(null);

  const previewUrl = useMemo(
    () => (value ? URL.createObjectURL(value) : null),
    [value],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleChange(fileList: FileList | null) {
    setErroLocal(null);
    const file = fileList?.[0] ?? null;
    if (!file) {
      onChange(null);
      return;
    }
    if (!TIPOS_ACEITOS.includes(file.type)) {
      setErroLocal("Use PNG, JPG ou WebP.");
      onChange(null);
      return;
    }
    if (file.size > MAX_BYTES) {
      setErroLocal("O arquivo deve ter no máximo 2 MB.");
      onChange(null);
      return;
    }
    onChange(file);
  }

  const mensagemErro = error ?? erroLocal;

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="text-sm font-medium leading-none">
        Logo da clínica{" "}
        <span className="font-normal text-muted-foreground">(opcional)</span>
      </label>

      <div
        className={cn(
          "flex flex-col gap-3 rounded-md border border-input bg-card p-3 sm:flex-row sm:items-center",
          mensagemErro && "border-destructive",
        )}
      >
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- preview local blob
            <img
              src={previewUrl}
              alt="Pré-visualização do logo"
              className="size-full object-contain"
            />
          ) : (
            <ImagePlus
              className="size-6 text-muted-foreground"
              aria-hidden
            />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <input
            id={inputId}
            type="file"
            accept={TIPOS_ACEITOS.join(",")}
            className="block w-full text-sm text-muted-foreground file:mr-3 file:inline-flex file:h-10 file:min-h-10 file:cursor-pointer file:rounded-md file:border-0 file:bg-secondary file:px-3 file:text-sm file:font-medium file:text-secondary-foreground hover:file:bg-secondary/80"
            onChange={(e) => handleChange(e.target.files)}
          />
          <p className="text-xs leading-[18px] text-muted-foreground">
            PNG, JPG ou WebP · até 2 MB
          </p>
        </div>

        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            aria-label="Remover logo"
            onClick={() => {
              setErroLocal(null);
              onChange(null);
            }}
          >
            <X className="size-[18px]" />
          </Button>
        ) : null}
      </div>

      {mensagemErro ? (
        <p role="alert" className="text-sm text-destructive">
          {mensagemErro}
        </p>
      ) : null}
    </div>
  );
}
