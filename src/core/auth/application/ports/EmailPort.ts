export type EmailConviteInput = {
  para: string;
  token: string;
  clinicaNome: string;
  papel: string;
};

export interface EmailPort {
  enviarConvite(input: EmailConviteInput): Promise<void>;
}
