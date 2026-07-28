import { CONVITE_TTL_MS } from "./constants";
import { DadosInvalidosError } from "@/core/shared/errors";

import { ConviteExpiradoError, ConviteJaAceitoError } from "./errors";
import type { Papel } from "./Papel";

export type ConviteProps = {
  id: string;
  clinicaId: string;
  email: string;
  papel: Papel;
  token: string;
  expiresAt: Date;
  aceitoEm: Date | null;
  convidadoPorUsuarioId: string;
};

export class Convite {
  readonly id: string;
  readonly clinicaId: string;
  readonly email: string;
  readonly papel: Papel;
  readonly token: string;
  readonly expiresAt: Date;
  readonly aceitoEm: Date | null;
  readonly convidadoPorUsuarioId: string;

  private constructor(props: ConviteProps) {
    this.id = props.id;
    this.clinicaId = props.clinicaId;
    this.email = props.email;
    this.papel = props.papel;
    this.token = props.token;
    this.expiresAt = props.expiresAt;
    this.aceitoEm = props.aceitoEm;
    this.convidadoPorUsuarioId = props.convidadoPorUsuarioId;
  }

  static criar(input: {
    id: string;
    clinicaId: string;
    email: string;
    papel: Papel;
    token: string;
    convidadoPorUsuarioId: string;
    agora?: Date;
  }): Convite {
    const agora = input.agora ?? new Date();
    const email = input.email.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      throw new DadosInvalidosError("E-mail do convite é inválido.");
    }

    return new Convite({
      id: input.id,
      clinicaId: input.clinicaId,
      email,
      papel: input.papel,
      token: input.token,
      expiresAt: new Date(agora.getTime() + CONVITE_TTL_MS),
      aceitoEm: null,
      convidadoPorUsuarioId: input.convidadoPorUsuarioId,
    });
  }

  static reconstituir(props: ConviteProps): Convite {
    return new Convite(props);
  }

  estaPendente(): boolean {
    return this.aceitoEm === null;
  }

  estaExpirado(agora: Date = new Date()): boolean {
    return agora.getTime() >= this.expiresAt.getTime();
  }

  assertPodeAceitar(agora: Date = new Date()): void {
    if (!this.estaPendente()) {
      throw new ConviteJaAceitoError(this.id);
    }
    if (this.estaExpirado(agora)) {
      throw new ConviteExpiradoError(this.id);
    }
  }

  aceitar(agora: Date = new Date()): Convite {
    this.assertPodeAceitar(agora);
    return Convite.reconstituir({
      id: this.id,
      clinicaId: this.clinicaId,
      email: this.email,
      papel: this.papel,
      token: this.token,
      expiresAt: this.expiresAt,
      aceitoEm: agora,
      convidadoPorUsuarioId: this.convidadoPorUsuarioId,
    });
  }
}
