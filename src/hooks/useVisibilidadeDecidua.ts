"use client";

import { useState } from "react";

import { deciduaVisivelPorPadrao } from "@/lib/odontograma/visibilidade-decidua";

/**
 * Estado do toggle de dentição decídua, com padrão por idade do paciente
 * (mesma regra do odontograma / periograma).
 */
export function useVisibilidadeDecidua(dataNascimentoIso: string) {
  const [mostrarDecidua, setMostrarDecidua] = useState(() =>
    deciduaVisivelPorPadrao(dataNascimentoIso),
  );

  function alternarDecidua() {
    setMostrarDecidua((v) => !v);
  }

  return { mostrarDecidua, setMostrarDecidua, alternarDecidua };
}
