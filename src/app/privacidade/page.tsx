import {
  LegalDocumentLayout,
  LegalSection,
} from "@/components/legal/LegalDocumentLayout";

export const metadata = {
  title: "Política de privacidade — Dentyvo",
  description:
    "Como a Dentyvo trata dados pessoais de contas e o papel de operadora sob a LGPD.",
};

export default function PrivacidadePage() {
  return (
    <LegalDocumentLayout title="Política de privacidade">
      <LegalSection id="intro" title="1. Introdução">
        <p>
          Esta Política descreve como a <strong>Dentyvo</strong> trata dados
          pessoais no contexto da plataforma SaaS de gestão para clínicas
          odontológicas, em conformidade com a Lei Geral de Proteção de
          Dados (LGPD — Lei nº 13.709/2018).
        </p>
        <p>
          Distinguimos claramente: (a) dados da{" "}
          <strong>conta/clínica</strong> tratados pela Dentyvo para prestar
          o serviço; e (b) dados de <strong>pacientes</strong>, dos quais a
          clínica é controladora e a Dentyvo é operadora.
        </p>
      </LegalSection>

      <LegalSection id="dados-conta" title="2. Dados que a Dentyvo coleta diretamente">
        <p>
          No cadastro e uso da conta, podemos coletar e tratar, entre
          outros:
        </p>
        <ul>
          <li>
            <strong>Dados do administrador e profissionais:</strong> nome,
            e-mail, credenciais de autenticação (incluindo login social,
            quando utilizado);
          </li>
          <li>
            <strong>Dados da clínica:</strong> nome/fantasia, endereço,
            documento fiscal (CPF ou CNPJ), logo e preferências de tema;
          </li>
          <li>
            <strong>Dados de assinatura e cobrança:</strong> plano
            contratado, status do trial/assinatura, histórico de cobranças
            e informações necessárias ao gateway de pagamento (tratadas
            conforme integração com o provedor);
          </li>
          <li>
            <strong>Dados técnicos de uso:</strong> registros de acesso,
            endereço IP, user-agent, logs de auditoria e cookies essenciais
            de sessão (ver{" "}
            <a href="/cookies" className="text-primary underline-offset-4 hover:underline">
              Política de Cookies
            </a>
            ).
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="finalidades" title="3. Como usamos esses dados">
        <ul>
          <li>Criar e autenticar contas e sessões;</li>
          <li>Provisionar o ambiente multi-tenant da clínica;</li>
          <li>Processar assinaturas, trials, promoções e cobranças;</li>
          <li>
            Enviar comunicações operacionais (convites, redefinição de
            senha, avisos de cobrança), quando o canal de e-mail estiver
            ativo;
          </li>
          <li>
            Garantir segurança, prevenção a fraudes, auditoria e melhoria
            do serviço;
          </li>
          <li>Cumprir obrigações legais e regulatórias.</li>
        </ul>
      </LegalSection>

      <LegalSection id="retencao" title="4. Prazo de retenção">
        <p>
          Mantemos os dados da conta pelo tempo necessário à prestação do
          serviço e às obrigações legais (fiscais, contábeis e de
          defesa em eventual litígio). Após o encerramento da conta,
          poderemos anonimizar ou eliminar dados quando não houver base
          legal para retenção.
        </p>
        <p>
          Logs de auditoria e registros de segurança podem ser retidos por
          prazos compatíveis com a prevenção a incidentes e exigências
          legais.
        </p>
      </LegalSection>

      <LegalSection id="direitos" title="5. Direitos do titular (LGPD)">
        <p>
          Titulares de dados tratados pela Dentyvo na qualidade de
          responsável pelo tratamento da conta podem solicitar, na forma
          da LGPD:
        </p>
        <ul>
          <li>Confirmação de tratamento e <strong>acesso</strong>;</li>
          <li>
            <strong>Correção</strong> de dados incompletos, inexatos ou
            desatualizados;
          </li>
          <li>
            <strong>Eliminação</strong> de dados desnecessários ou
            excessivos, quando cabível;
          </li>
          <li>
            <strong>Portabilidade</strong>, observados segredos comercial
            e industrial e a viabilidade técnica;
          </li>
          <li>
            <strong>Revogação</strong> do consentimento, quando o
            tratamento se basear nessa hipótese;
          </li>
          <li>
            Informação sobre compartilhamentos e possibilidade de não
            fornecer consentimento (com consequências esclarecidas).
          </li>
        </ul>
        <p>
          Pedidos relacionados a <strong>dados de pacientes</strong> devem
          ser dirigidos prioritariamente à <strong>clínica
          controladora</strong>. A Dentyvo, como operadora, apoiará a
          clínica na medida do contrato e da lei.
        </p>
      </LegalSection>

      <LegalSection id="dpo" title="6. Encarregado de dados (DPO)">
        <p>
          Contato do encarregado de proteção de dados (DPO):{" "}
          <strong>dpo@dentyvo.com.br</strong>{" "}
          <span className="text-muted-foreground">
            (placeholder — e-mail a definir na revisão jurídica /
            estruturação societária).
          </span>
        </p>
      </LegalSection>

      <LegalSection id="pacientes-operadora" title="7. Dados de pacientes — clínica controladora, Dentyvo operadora">
        <p>
          <strong>
            O tratamento de dados de pacientes (incluindo dados sensíveis
            de saúde) é de responsabilidade da clínica, na qualidade de
            CONTROLADORA.
          </strong>{" "}
          A Dentyvo processa esses dados como <strong>OPERADORA</strong>,
          sob instruções da clínica, para viabilitar agenda, prontuário,
          odontograma, periograma, receituário, notificações e demais
          módulos contratados.
        </p>
        <p>
          A clínica é responsável por bases legais, consentimentos,
          transparência perante pacientes e atendimento a direitos dos
          titulares no âmbito do atendimento odontológico.
        </p>
        <p>
          A Dentyvo aplica medidas de segurança alinhadas ao desenho da
          plataforma, incluindo, entre outras já documentadas no produto:
        </p>
        <ul>
          <li>
            <strong>Isolamento por tenant</strong> (separação lógica dos
            dados por clínica);
          </li>
          <li>
            <strong>Controle de acesso</strong> baseado em papéis
            (admin, dentista, secretária etc.);
          </li>
          <li>
            <strong>Auditoria</strong> de acessos e operações sensíveis,
            quando aplicável aos módulos;
          </li>
          <li>
            Proteção de credenciais, sessões e canais de autenticação
            (incluindo boas práticas de account linking).
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="compartilhamento" title="8. Compartilhamento">
        <p>
          Podemos compartilhar dados da conta com prestadores essenciais
          (hospedagem, banco de dados, autenticação, armazenamento de
          arquivos, gateway de pagamento, e-mail transacional), sempre
          sob contratos e limites compatíveis com a finalidade do
          serviço. Não vendemos dados pessoais.
        </p>
      </LegalSection>

      <LegalSection id="alteracoes" title="9. Alterações">
        <p>
          Esta Política pode ser atualizada. Alterações relevantes serão
          comunicadas pelos canais da plataforma ou por e-mail, quando
          apropriado. A versão vigente estará sempre publicada em
          /privacidade.
        </p>
      </LegalSection>
    </LegalDocumentLayout>
  );
}
