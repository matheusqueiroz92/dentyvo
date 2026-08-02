import { LegalSection } from "@/components/legal/LegalDocumentLayout";
import { PageLegalContainer } from "@/components/legal/PageLegalContainer";

export const metadata = {
  title: "Política de cookies — Dentyvo",
  description:
    "Como a Dentyvo utiliza cookies e tecnologias semelhantes na plataforma.",
};

export default function CookiesPage() {
  return (
    <PageLegalContainer title="Política de cookies">
      <LegalSection id="o-que-sao" title="1. O que são cookies">
        <p>
          Cookies são pequenos arquivos armazenados no seu navegador
          quando você acessa a Dentyvo. Também podemos usar tecnologias
          semelhantes (ex.: armazenamento local da sessão do navegador
          para rascunhos de cadastro).
        </p>
      </LegalSection>

      <LegalSection id="categorias" title="2. Categorias utilizadas">
        <p>
          <strong>Essenciais / sessão:</strong> necessários para
          autenticar usuários, manter a sessão segura, proteger contra
          abusos e permitir o funcionamento básico da plataforma (login,
          cadastro, áreas autenticadas). Sem esses cookies, o serviço não
          opera corretamente.
        </p>
        <p>
          <strong>Analytics:</strong> atualmente a Dentyvo{" "}
          <strong>não</strong> utiliza cookies de analytics de terceiros
          de forma ativa nesta versão. Se no futuro forem adotados
          (ex.: métricas agregadas de uso), esta Política será
          atualizada e, quando exigido, solicitaremos consentimento.
        </p>
        <p>
          <strong>Publicidade:</strong> a Dentyvo{" "}
          <strong>não veicula anúncios</strong> e{" "}
          <strong>não utiliza cookies de publicidade</strong> ou
          remarketing.
        </p>
      </LegalSection>

      <LegalSection id="gestao" title="3. Como gerenciar">
        <p>
          Você pode configurar o navegador para bloquear ou apagar
          cookies. Bloquear cookies essenciais pode impedir o login e o
          uso da plataforma.
        </p>
      </LegalSection>

      <LegalSection id="mais" title="4. Mais informações">
        <p>
          Para o tratamento de dados pessoais em geral, consulte a{" "}
          <a
            href="/privacidade"
            className="text-primary underline-offset-4 hover:underline"
          >
            Política de Privacidade
          </a>{" "}
          e os{" "}
          <a
            href="/termos"
            className="text-primary underline-offset-4 hover:underline"
          >
            Termos de uso
          </a>
          .
        </p>
      </LegalSection>
    </PageLegalContainer>
  );
}
