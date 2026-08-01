import {
  LegalDocumentLayout,
  LegalSection,
} from "@/components/legal/LegalDocumentLayout";
import {
  DURACAO_PROMOCAO_LANCAMENTO_MESES,
  DURACAO_TRIAL_DIAS,
  LIMITE_VAGAS_PROMOCIONAIS_LANCAMENTO,
} from "@/core/assinatura/domain/constants";

export const metadata = {
  title: "Termos de uso — Dentyvo",
  description:
    "Termos de uso da plataforma Dentyvo para clínicas odontológicas.",
};

export default function TermosPage() {
  return (
    <LegalDocumentLayout title="Termos de uso">
      <LegalSection id="identificacao" title="1. Identificação">
        <p>
          Estes Termos de Uso regulam o acesso e a utilização da plataforma{" "}
          <strong>Dentyvo</strong>, solução de software como serviço (SaaS)
          destinada à gestão operacional de clínicas e consultórios
          odontológicos.
        </p>
        <p>
          A Dentyvo é operada pela pessoa jurídica responsável pela
          disponibilização do serviço (doravante &quot;Dentyvo&quot;,
          &quot;nós&quot; ou &quot;plataforma&quot;). Dados cadastrais e de
          contato oficiais serão confirmados na revisão jurídica pré-lançamento.
        </p>
        <p>
          Ao criar conta, assinar um plano ou utilizar a plataforma, a clínica
          (doravante &quot;Cliente&quot; ou &quot;você&quot;) declara ter lido
          e concordado com estes Termos e com a{" "}
          <a href="/privacidade" className="text-primary underline-offset-4 hover:underline">
            Política de Privacidade
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection id="objeto" title="2. Objeto do serviço">
        <p>
          A Dentyvo oferece ferramentas digitais para apoio à operação da
          clínica, podendo incluir, conforme o plano contratado: agenda e
          agendamentos, cadastro de pacientes, prontuário e registros
          clínicos, odontograma, periograma, receituário, notificações,
          integrações (ex.: WhatsApp) e gestão de assinatura/cobrança.
        </p>
        <p>
          O serviço é prestado na modalidade SaaS, acessível pela internet,
          sob responsabilidade técnica da Dentyvo quanto à disponibilidade
          razoável da plataforma e às medidas de segurança descritas na
          Política de Privacidade.
        </p>
      </LegalSection>

      <LegalSection id="lgpd-papeis" title="3. Papéis na LGPD: clínica e Dentyvo">
        <p>
          Em relação aos <strong>dados de pacientes</strong> e demais titulares
          atendidos pela clínica:
        </p>
        <ul>
          <li>
            A <strong>clínica é CONTROLADORA</strong> dos dados pessoais e de
            saúde que coleta e trata no contexto do atendimento odontológico.
            Compete à clínica definir as finalidades, obter as bases legais
            adequadas (incluindo consentimento quando exigido) e atender
            direitos dos titulares perante seus pacientes.
          </li>
          <li>
            A <strong>Dentyvo atua como OPERADORA</strong>: processa esses
            dados em nome e sob instruções da clínica, para viabilizar o uso
            da plataforma, conforme a Lei Geral de Proteção de Dados (LGPD —
            Lei nº 13.709/2018).
          </li>
        </ul>
        <p>
          Em relação aos <strong>dados da própria conta</strong> do Cliente
          (administrador, profissionais, dados cadastrais da clínica e
          cobrança), a Dentyvo trata essas informações para prestar e
          administrar o serviço, nos termos da Política de Privacidade.
        </p>
      </LegalSection>

      <LegalSection id="obrigacoes-clinica" title="4. Obrigações da clínica">
        <p>O Cliente compromete-se a:</p>
        <ul>
          <li>
            Utilizar a plataforma apenas para finalidades lícitas e
            compatíveis com a prática odontológica e a legislação aplicável
            (incluindo normas do CFO/conselhos e LGPD);
          </li>
          <li>
            Garantir base legal adequada e, quando necessário,{" "}
            <strong>consentimento</strong> de seus pacientes para o tratamento
            de dados sensíveis de saúde inseridos na Dentyvo;
          </li>
          <li>
            Informar pacientes, quando aplicável, sobre o uso de sistemas e
            operadores no tratamento de seus dados;
          </li>
          <li>
            Manter credenciais de acesso sob controle, atribuir papéis
            adequados aos profissionais e não compartilhar senhas;
          </li>
          <li>
            Inserir na plataforma apenas dados verdadeiros, atualizados e
            necessários à operação da clínica;
          </li>
          <li>
            Não utilizar a Dentyvo para fins que violem direitos de terceiros,
            normas éticas ou a segurança da informação.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="planos-cobranca" title="5. Planos, trial e cobrança">
        <p>
          O acesso pode iniciar com período de{" "}
          <strong>trial gratuito de {DURACAO_TRIAL_DIAS} dias</strong>,
          conforme condições vigentes na contratação. Após o trial, a
          continuidade depende da assinatura de um plano pago.
        </p>
        <p>
          <strong>Promoção de lançamento:</strong> as primeiras{" "}
          {LIMITE_VAGAS_PROMOCIONAIS_LANCAMENTO} clínicas elegíveis podem
          contratar planos participantes com preço promocional pelo período
          de {DURACAO_PROMOCAO_LANCAMENTO_MESES} meses, nos termos da oferta
          publicada no momento da contratação. Esgotadas as vagas ou
          encerrada a promoção, aplicam-se os preços cheios dos planos. A
          Dentyvo pode comunicar com antecedência a migração para o preço
          cheio, conforme regras da promoção.
        </p>
        <p>
          Valores, ciclos de cobrança (mensal no MVP), métodos de pagamento e
          eventuais impostos serão apresentados no fluxo de assinatura. A
          inadimplência pode resultar em restrição de funcionalidades ou
          suspensão do acesso, após os prazos de tolerância comunicados na
          plataforma.
        </p>
      </LegalSection>

      <LegalSection id="cancelamento" title="6. Cancelamento">
        <p>
          O Cliente pode solicitar o cancelamento da assinatura pelos canais
          indicados na plataforma ou no suporte. O cancelamento observa o
          ciclo de cobrança já iniciado, salvo disposição legal ou
          contratual em contrário.
        </p>
        <p>
          Após o encerramento, a Dentyvo poderá reter ou eliminar dados
          conforme a Política de Privacidade, obrigações legais e o papel de
          operadora — cabendo à clínica, como controladora, providenciar
          exportação ou continuidade do tratamento dos dados de pacientes
          quando necessário.
        </p>
      </LegalSection>

      <LegalSection id="limitacao" title="7. Limitação de responsabilidade">
        <p>
          A Dentyvo emprega esforços razoáveis para manter a plataforma
          disponível e segura, sem garantir operação ininterrupta ou isenta
          de erros. Em nenhuma hipótese a Dentyvo se responsabiliza por:
        </p>
        <ul>
          <li>
            Decisões clínicas, diagnósticos, tratamentos ou prescrições
            realizados pelos profissionais da clínica;
          </li>
          <li>
            Conteúdo inserido pelo Cliente ou cumprimento das obrigações de
            controladora perante pacientes;
          </li>
          <li>
            Indisponibilidades causadas por fatores fora do controle
            razoável da Dentyvo (força maior, falhas de terceiros, etc.);
          </li>
          <li>
            Danos indiretos, lucros cessantes ou perda de oportunidade, na
            máxima extensão permitida pela lei.
          </li>
        </ul>
        <p>
          A responsabilidade total da Dentyvo, quando apurada, fica limitada,
          no agregado, aos valores efetivamente pagos pelo Cliente nos
          doze (12) meses anteriores ao evento, salvo disposição legal
          imperativa em contrário.
        </p>
      </LegalSection>

      <LegalSection id="foro" title="8. Lei aplicável e foro">
        <p>
          Estes Termos são regidos pelas leis da República Federativa do
          Brasil. Fica eleito o foro da comarca da sede da Dentyvo (a ser
          confirmada na revisão jurídica), com renúncia a qualquer outro,
          por mais privilegiado que seja, salvo prerrogativa legal do
          consumidor quando aplicável.
        </p>
      </LegalSection>

      <LegalSection id="contato-termos" title="9. Contato">
        <p>
          Dúvidas sobre estes Termos:{" "}
          <strong>contato@dentyvo.com.br</strong> (placeholder — confirmar
          na revisão jurídica).
        </p>
      </LegalSection>
    </LegalDocumentLayout>
  );
}
