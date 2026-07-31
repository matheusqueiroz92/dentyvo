import { gerarCnpjValido } from "./cnpj";

/** Dados únicos por execução (padrão timestamp do script de integração). */
export function dadosClinicaUnicos(prefixo = "e2e") {
  const agora = Date.now();
  return {
    agora,
    nomeClinica: `Clínica ${prefixo} ${agora}`,
    endereco: `Rua E2E ${agora}, 100 - São Paulo/SP`,
    /** CNPJ — tipo padrão do SignupForm (evita Select no Playwright). */
    documento: gerarCnpjValido(),
    adminNome: `Admin ${prefixo}`,
    email: `${prefixo}.admin.${agora}@dentyvo-e2e.test`,
    senha: "SenhaForte!123",
  };
}
