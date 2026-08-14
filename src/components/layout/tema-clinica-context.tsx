"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { TemaClinica } from "@/core/auth/domain/TemaClinica";

type TemaClinicaContextValue = {
  tema: TemaClinica;
  aplicarTema: (tema: TemaClinica) => void;
};

const TemaClinicaContext = createContext<TemaClinicaContextValue | null>(null);

type TemaClinicaProviderProps = {
  temaInicial: TemaClinica;
  children: ReactNode;
};

/** Estado de tema do shell autenticado — permite troca imediata sem reload. */
export function TemaClinicaProvider({
  temaInicial,
  children,
}: TemaClinicaProviderProps) {
  const [tema, setTema] = useState<TemaClinica>(temaInicial);
  const value = useMemo(
    () => ({ tema, aplicarTema: setTema }),
    [tema],
  );

  return (
    <TemaClinicaContext.Provider value={value}>
      {children}
    </TemaClinicaContext.Provider>
  );
}

export function useTemaClinica(): TemaClinicaContextValue {
  const ctx = useContext(TemaClinicaContext);
  if (!ctx) {
    throw new Error(
      "useTemaClinica deve ser usado dentro de TemaClinicaProvider.",
    );
  }
  return ctx;
}
