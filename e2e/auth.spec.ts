import { expect, test } from "@playwright/test";

import {
  buscarAssinaturaPorDocumento,
  buscarTokenResetSenhaPorEmail,
  fecharPoolE2e,
} from "./helpers/db";
import { dadosClinicaUnicos } from "./helpers/unique";

test.afterAll(async () => {
  await fecharPoolE2e();
});

async function preencherCadastro(
  page: import("@playwright/test").Page,
  dados: ReturnType<typeof dadosClinicaUnicos>,
) {
  await page.goto("/cadastro");
  await page.getByLabel("Seu nome").fill(dados.adminNome);
  await page.getByLabel("E-mail").fill(dados.email);
  await page.getByLabel("Senha", { exact: true }).fill(dados.senha);
  await page.getByLabel("Confirmar senha").fill(dados.senha);
  await page.getByRole("button", { name: "Selecionar" }).first().click();
  await page
    .getByRole("checkbox", { name: /Li e aceito os Termos de uso/i })
    .click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();

  await expect(page).toHaveURL(/\/cadastro\/clinica/, { timeout: 15_000 });
  await page.getByLabel("Nome da clínica").fill(dados.nomeClinica);
  await page.getByLabel("Endereço").fill(dados.endereco);
  // Tipo padrão do formulário é CNPJ — preenche o campo sem abrir o Select.
  await page.getByLabel("CNPJ").fill(dados.documento);
  await page.getByRole("button", { name: "Criar clínica e entrar" }).click();
}

test.describe("Auth e2e", () => {
  test("1. cadastro de clínica cria Assinatura trialing e vai para /dashboard", async ({
    page,
  }) => {
    const dados = dadosClinicaUnicos("cadastro");
    await preencherCadastro(page, dados);

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    const assinatura = await buscarAssinaturaPorDocumento(dados.documento);
    expect(assinatura).not.toBeNull();
    expect(assinatura?.status).toBe("trialing");
  });

  test("2. cadastro com documento duplicado mostra erro amigável", async ({
    page,
  }) => {
    const dados = dadosClinicaUnicos("dup");
    await preencherCadastro(page, dados);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });

    await page.context().clearCookies();

    const segunda = {
      ...dadosClinicaUnicos("dup2"),
      documento: dados.documento,
    };
    await preencherCadastro(page, segunda);

    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "Já existe uma clínica com este documento fiscal." }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/cadastro/);
  });

  test("3. login válido como admin redireciona para /dashboard", async ({
    page,
  }) => {
    const dados = dadosClinicaUnicos("login-ok");
    await preencherCadastro(page, dados);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });

    await page.context().clearCookies();
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(dados.email);
    await page.getByLabel("Senha", { exact: true }).fill(dados.senha);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  test("4. login com credenciais inválidas mostra erro e não redireciona", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill("naoexiste@example.com");
    await page.getByLabel("Senha", { exact: true }).fill("SenhaErrada!999");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(
      page.getByRole("alert").filter({ hasText: /E-mail ou senha inválidos/i }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("5. fluxo esqueci senha com token do banco e nova senha", async ({
    page,
  }) => {
    const dados = dadosClinicaUnicos("reset");
    await preencherCadastro(page, dados);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });

    await page.context().clearCookies();
    await page.goto("/esqueceu-senha");
    await page.getByLabel("E-mail").fill(dados.email);
    await page.getByRole("button", { name: "Enviar link" }).click();
    await expect(page.getByRole("status")).toContainText(
      "Se existir uma conta com este e-mail",
      { timeout: 15_000 },
    );

    const token = await buscarTokenResetSenhaPorEmail(dados.email);
    expect(token).toBeTruthy();

    const novaSenha = "NovaSenha!456";
    await page.goto(`/reset-senha?token=${token}`);
    await page.getByLabel("Nova senha").fill(novaSenha);
    await page.getByLabel("Confirmar senha").fill(novaSenha);
    await page.getByRole("button", { name: "Redefinir senha" }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });

    await page.getByLabel("E-mail").fill(dados.email);
    await page.getByLabel("Senha", { exact: true }).fill(dados.senha);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: /E-mail ou senha inválidos|Invalid email or password|Não foi possível entrar/i }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/login/);

    await page.getByLabel("Senha", { exact: true }).fill(novaSenha);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
  });

  test("6. sessão autenticada em /login redireciona automaticamente", async ({
    page,
  }) => {
    const dados = dadosClinicaUnicos("sessao");
    await preencherCadastro(page, dados);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });

    await page.goto("/login");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
  });

  test("7. login e cadastro mostram Continuar com Google", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("button", { name: "Continuar com Google" }),
    ).toBeVisible();

    await page.goto("/cadastro");
    await expect(
      page.getByRole("button", { name: "Continuar com Google" }),
    ).toBeVisible();
  });
});
