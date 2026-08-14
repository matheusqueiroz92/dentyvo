export type FaqItem = {
  pergunta: string;
  resposta: string;
};

export const FAQS_LANDING: readonly FaqItem[] = [
  {
    pergunta: "Preciso instalar algum programa?",
    resposta:
      "Não, a Dentyvo funciona inteiramente pelo navegador, sem instalação.",
  },
  {
    pergunta: "Como funciona o período de teste?",
    resposta:
      "14 dias gratuitos, sem necessidade de cartão de crédito para começar.",
  },
  {
    pergunta: "A secretária virtual do WhatsApp substitui minha recepcionista?",
    resposta:
      "Não, ela trabalha junto com sua equipe, atendendo automaticamente fora do horário ou quando não há ninguém disponível.",
  },
  {
    pergunta: "Meus dados e os dos meus pacientes estão seguros?",
    resposta:
      "Sim, seguimos princípios de proteção de dados de saúde (LGPD), com controle de acesso e auditoria completos.",
  },
  {
    pergunta: "Posso mudar de plano depois?",
    resposta:
      "Sim, você pode fazer upgrade ou downgrade a qualquer momento pelo painel.",
  },
  {
    pergunta: "Como funciona a promoção de lançamento?",
    resposta:
      "As 30 primeiras clínicas garantem desconto nos planos Básico e Médio pelos primeiros 12 meses.",
  },
];

const ADAPTACOES_APP: Record<string, string> = {
  "Preciso instalar algum programa?":
    "Não. A Dentyvo continua no navegador, sem instalação. Use o mesmo endereço de sempre para entrar na clínica.",
  "Como funciona o período de teste?":
    "O trial dura 14 dias, sem cartão. O status e o vencimento aparecem em Configurações → Assinatura, visíveis para o administrador.",
  "Meus dados e os dos meus pacientes estão seguros?":
    "Sim. O acesso é separado por papel (administrador, dentista e recepção) e as ações clínicas ficam auditadas, alinhado à LGPD.",
  "Posso mudar de plano depois?":
    "Sim. O administrador altera o plano em Configurações → Assinatura.",
  "Como funciona a promoção de lançamento?":
    "As 30 primeiras clínicas mantêm o desconto nos planos Básico e Médio pelos 12 primeiros meses. O valor vigente aparece em Configurações → Assinatura.",
};

const EXTRAS_APP: readonly FaqItem[] = [
  {
    pergunta: "Como cadastro um paciente?",
    resposta:
      "Em Pacientes, use Novo paciente — ou o atalho no dashboard. Nome, CPF e telefone são obrigatórios.",
  },
  {
    pergunta: "Como marco uma consulta?",
    resposta:
      "Em Agenda, use Nova consulta. Escolha profissional, paciente, horário e procedimento. O sistema impede overbooking do mesmo profissional.",
  },
  {
    pergunta: "Onde fica o prontuário, o odontograma e o receituário?",
    resposta:
      "Abra o paciente em Pacientes ou use Prontuários. Odontograma, periograma, receitas e atestados ficam no prontuário do paciente.",
  },
  {
    pergunta: "Quem pode alterar dados da clínica e da assinatura?",
    resposta:
      "Somente o administrador, em Configurações. Dentista e recepção veem as próprias notificações, mas não os dados cadastrais da clínica.",
  },
  {
    pergunta: "Como reporto um erro ou tiro uma dúvida?",
    resposta:
      "Use o formulário nesta página: escolha Bug ou Dúvida, descreva o que aconteceu e envie. Você também pode escrever para o e-mail ou WhatsApp comercial.",
  },
];

export const FAQS_APP: readonly FaqItem[] = [
  ...FAQS_LANDING.map((item) => ({
    pergunta: item.pergunta,
    resposta: ADAPTACOES_APP[item.pergunta] ?? item.resposta,
  })),
  ...EXTRAS_APP,
];
