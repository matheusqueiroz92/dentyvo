import { eq } from "drizzle-orm";

import { db } from "@/db";
import { profissional, usuarioPlataforma } from "@/db/schema";
import {
  determinarDestinoAuth,
  type AuthDestinoLookups,
  type DestinoAuth,
} from "@/lib/auth-destino";

/** Lookups concretos via Drizzle (somente server). */
export function criarLookupsAuthDestino(
  database: typeof db = db,
): AuthDestinoLookups {
  return {
    async buscarUsuarioPlataformaPorId(id) {
      return (
        (await database.query.usuarioPlataforma.findFirst({
          where: eq(usuarioPlataforma.id, id),
        })) ?? null
      );
    },
    async buscarUsuarioPlataformaPorEmail(email) {
      const normalizado = email.trim().toLowerCase();
      return (
        (await database.query.usuarioPlataforma.findFirst({
          where: eq(usuarioPlataforma.email, normalizado),
        })) ?? null
      );
    },
    async buscarProfissionalPorUsuarioId(usuarioId) {
      return (
        (await database.query.profissional.findFirst({
          where: eq(profissional.usuarioId, usuarioId),
        })) ?? null
      );
    },
  };
}

export async function resolverDestinoAuth(input: {
  usuarioId: string;
  email: string;
}): Promise<DestinoAuth | null> {
  return determinarDestinoAuth(criarLookupsAuthDestino(), input);
}

export async function usuarioTemVinculoAutorizado(
  usuarioId: string,
): Promise<boolean> {
  const lookups = criarLookupsAuthDestino();
  const [plat, prof] = await Promise.all([
    lookups.buscarUsuarioPlataformaPorId(usuarioId),
    lookups.buscarProfissionalPorUsuarioId(usuarioId),
  ]);
  return Boolean(plat || prof);
}
