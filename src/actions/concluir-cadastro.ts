"use server";

import { z } from "zod";

import { cadastrarClinicaComTrial } from "@/actions/cadastrar-clinica-com-trial";
import { IniciarTrial } from "@/core/assinatura/application/use-cases/IniciarTrial";
import { DrizzleAssinaturaRepository } from "@/core/assinatura/infra/adapters";
import { createAssinaturaModuleFromEnv } from "@/core/assinatura/infra/create-assinatura-module";
import { AtualizarLogoClinica } from "@/core/auth/application/use-cases/AtualizarLogoClinica";
import { AtualizarTemaClinica } from "@/core/auth/application/use-cases/AtualizarTemaClinica";
import { CriarClinicaComAdmin } from "@/core/auth/application/use-cases/CriarClinicaComAdmin";
import { TEMAS_CLINICA } from "@/core/auth/domain/TemaClinica";
import { createAuthModule } from "@/core/auth/infra/create-auth-module";
import { db } from "@/db";
import { garantirPlanosCatalogo } from "@/lib/cadastro/garantir-planos";
import { isPlanoCadastroId } from "@/lib/cadastro/planos";
import { actionClient } from "@/lib/safe-action";
import { BlobStorageAdapter } from "@/lib/storage";

const schema = z.object({
  admin: z.object({
    nome: z.string().min(1),
    email: z.string().email(),
    senha: z.string().min(8),
  }),
  clinica: z.object({
    nome: z.string().min(1),
    endereco: z.string().min(1),
    tipoDocumento: z.enum(["cpf", "cnpj"]),
    documento: z.string().min(1),
  }),
  planoId: z.string().refine(isPlanoCadastroId),
  tema: z.enum(TEMAS_CLINICA),
  /** Data URL ou omitido — logo sobe via campo separado `logo` (FormData). */
  logoBase64: z.string().optional(),
  logoContentType: z.string().optional(),
  logoFileName: z.string().optional(),
});

/**
 * Etapa 2 do cadastro (delivery):
 * CriarClinicaComAdmin → IniciarTrial → logo/tema → CriarAssinatura (012).
 *
 * Mantém `CriarClinicaComAdmin` intacto (sem criar usuário isolado na etapa 1).
 */
export const concluirCadastroAction = actionClient
  .inputSchema(schema)
  .action(async ({ parsedInput }) => {
    const auth = createAuthModule();
    const criarClinicaComAdmin = new CriarClinicaComAdmin(
      auth.clinicaRepo,
      auth.profissionalRepo,
      auth.authPort,
    );
    const iniciarTrial = new IniciarTrial(new DrizzleAssinaturaRepository(db));

    const clinica = await cadastrarClinicaComTrial(
      { criarClinicaComAdmin, iniciarTrial },
      {
        clinica: parsedInput.clinica,
        admin: parsedInput.admin,
      },
    );

    const usuario = await auth.authPort.buscarUsuarioPorEmail(
      parsedInput.admin.email,
    );
    if (!usuario) {
      throw new Error(
        "Usuário admin não encontrado após criar a clínica.",
      );
    }

    const atualizarTema = new AtualizarTemaClinica(
      auth.clinicaRepo,
      auth.profissionalRepo,
    );
    await atualizarTema.executar({
      clinicaId: clinica.id,
      solicitadoPorUsuarioId: usuario.id,
      tema: parsedInput.tema,
    });

    if (parsedInput.logoBase64 && parsedInput.logoContentType) {
      try {
        const buffer = Buffer.from(parsedInput.logoBase64, "base64");
        const ext =
          parsedInput.logoContentType === "image/png"
            ? "png"
            : parsedInput.logoContentType === "image/webp"
              ? "webp"
              : "jpg";
        const pathname = `clinicas/${clinica.id}/logo.${ext}`;
        const storage = new BlobStorageAdapter();
        const uploaded = await storage.upload({
          pathname,
          body: buffer,
          contentType: parsedInput.logoContentType,
        });

        const atualizarLogo = new AtualizarLogoClinica(
          auth.clinicaRepo,
          auth.profissionalRepo,
        );
        await atualizarLogo.executar({
          clinicaId: clinica.id,
          solicitadoPorUsuarioId: usuario.id,
          logoUrl: uploaded.url,
        });
      } catch (erro) {
        console.error(
          `[concluir-cadastro] upload/logo falhou para clínica ${clinica.id}; clínica mantida sem logo.`,
          erro,
        );
      }
    }

    try {
      const assinaturaModule = createAssinaturaModuleFromEnv();
      await garantirPlanosCatalogo(assinaturaModule.planoRepo);
      await assinaturaModule.criarAssinatura.executar({
        clinicaId: clinica.id,
        planoId: parsedInput.planoId,
        metodoPagamento: "pix",
        solicitadoPorUsuarioId: usuario.id,
      });
    } catch (erro) {
      console.error(
        `[concluir-cadastro] CriarAssinatura falhou para clínica ${clinica.id}; trial mantido sem plano vinculado.`,
        erro,
      );
    }

    return {
      clinicaId: clinica.id,
      email: parsedInput.admin.email,
    };
  });
