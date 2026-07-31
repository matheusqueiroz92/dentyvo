# Visão Geral do Produto

## Problema

Muitas clínicas e consultórios odontológicos de pequeno/médio porte (contexto
inicial: Vitória da Conquista/BA e região) ainda operam com papel ou planilhas
para agendamento, anamnese, odontograma, periograma e receituário. Perdem tempo
de atendimento preenchendo documentos manualmente, não têm gestão centralizada, e
muitas não têm secretária para atender o WhatsApp/telefone. As plataformas
existentes no mercado têm custo incompatível com o porte dessas clínicas.

## Proposta de valor

Plataforma SaaS multi-tenant, acessível financeiramente, que digitaliza o
fluxo completo do consultório odontológico: agendamento, prontuário, odontograma,
periograma, receituário — e resolve a ausência de secretária com um bot de
WhatsApp ("secretária virtual") que atende, tira dúvidas e agenda consultas
automaticamente.

## Personas

- **Dentista/dono da clínica**: quer reduzir tempo administrativo, ter prontuário
  digital confiável, e não perder pacientes por falta de resposta rápida no
  WhatsApp.
- **Recepcionista/atendente** (quando existe): usa o painel para gerenciar agenda
  e assumir conversas do bot quando necessário.
- **Paciente**: quer agendar/remarcar consulta e tirar dúvidas simples sem
  precisar ligar em horário comercial.

## Objetivos do MVP

1. Autenticação multi-tenant (clínica = tenant).
2. Agendamento (profissionais, disponibilidade, confirmação, lembrete).
3. Prontuário eletrônico com anamnese digital.
4. Receituário com modelo padrão.
5. Bot de WhatsApp (secretária virtual) via Meta Cloud API com Embedded Signup:
   boas-vindas, menu (marcar consulta / orçamento / falar com atendente).
6. Painel administrativo (super-admin) para o dono da plataforma gerenciar
   todas as clínicas e usuários com acesso cross-tenant.
7. Assinatura e pagamento via gateway nacional com PIX (ex: Asaas), controlando
   bloqueio/liberação de acesso conforme status de pagamento da clínica.

## Fora do escopo do MVP (v2+)

- Odontograma interativo completo (mapa por dente/face).
- Periograma completo (sondagem, gráficos).
- Funcionalidades de IA (transcrição de consulta, geração de receita por texto
  livre, previsão de no-show).
- Financeiro avançado (comissionamento, conciliação).

## Objetivos futuros

- **013 — Financeiro:** ver seção detalhada abaixo. Até a spec formal existir,
  o dashboard deve **omitir** cartões de faturamento resumido e contas
  vencidas referenciados em `docs/DESIGN_SYSTEM.md` (seção 8), sem simular
  ou mockar dado financeiro.
- **014 — Estoque/Insumos:** ver seção detalhada abaixo. Sem urgência de
  schema agora — módulo desenhável do zero quando chegar a vez.

## Financeiro — planejamento futuro (spec 013)

Registro **conceitual** (sem spec formal ainda). Escopo previsto em três
camadas; a spec formal (`specs/features/013-*.md`, com RBAC, critérios de
aceite e plano de testes) só será aberta quando o desenvolvimento chegar a
essa etapa. Este texto orienta decisões de modelagem anteriores (ex.:
`Evolucao.agendamentoId` na 003), evitando retrabalho.

### a) Contas a receber (financeiro do paciente)

Registro de cobrança por atendimento realizado — entidade prevista:
`CobrancaPaciente` (vocabulário reservado em `specs/02-domain-model.md`).

- Vínculo com a visita clínica via `Evolucao.agendamentoId` (e, quando
  aplicável, valor de referência em `Procedimento.valor`).
- Status: `pendente` | `pago` | `vencido` | `cancelado` | `estornado`.
- Método de pagamento.
- Histórico de pagamentos parciais, se aplicável.

### b) Faturamento da clínica (relatório, não dado próprio)

Agregações **calculadas sob demanda** sobre (a) — faturamento por período,
por profissional, por tipo de procedimento. Mesmo princípio de “calcular,
não persistir duplicado” já usado nas métricas do periograma (spec 005).

### c) Contas a pagar (despesas operacionais)

Módulo separado — entidade prevista: `DespesaOperacional` (vocabulário
reservado em `specs/02-domain-model.md`).

- Categorias de despesa (aluguel, salário, material, equipamento, …).
- Recorrência, vencimento, status de pagamento.
- **Não depende** de (a)/(b): rastreio independente de custo.
- Junto de (b), permite calcular lucro real (receita − despesa), não só
  faturamento bruto.
- Compra de insumo (spec 014) é categoria natural de `DespesaOperacional`
  — desenhar 013 e 014 em conjunto nesse ponto para não duplicar o
  conceito de “custo”.

## Estoque/Insumos — planejamento futuro (spec 014)

Registro **conceitual** (sem spec formal ainda). Escopo em duas camadas
possíveis; a **decisão de profundidade** (básico vs. completo) fica para
quando a spec formal (`specs/features/014-*.md`) for aberta de verdade.

### Sem alteração preparatória agora

Diferente do vínculo `Evolucao`↔`Agendamento` (ajuste imediato na 003 por
rastreabilidade histórica), este módulo **não precisa de nenhuma alteração
de schema agora**. Pode ser desenhado do zero quando chegar a vez, sem
retrabalho de dado retroativo — **não gerar falsa urgência**.

### Camada básica

- Entidade prevista: `InsumoOdontologico` (nome, unidade de medida,
  quantidade em estoque, quantidade mínima).
- Registro manual de entrada/saída.
- Alerta de estoque baixo via módulo de notificação (011, já implementado)
  — tipo novo `estoque_baixo`.

### Camada completa *(avaliar necessidade real antes de decidir)*

- Rastreio de lote e validade (relevante para segurança do paciente em
  materiais como anestésico).
- Vínculo de consumo automático por `Procedimento` (“lista de materiais”
  por tipo de procedimento).
- Gestão de fornecedor.

### Conexão com o financeiro (013)

Compra de insumo é categoria natural de `DespesaOperacional`. Considerar
essa relação ao desenhar ambas as specs, para não duplicar o conceito de
“custo”.

## Restrições e conformidade

- LGPD: dado de saúde é dado sensível — exige consentimento explícito,
  criptografia em repouso para dados clínicos e tokens de integração, e log de
  auditoria de acesso ao prontuário.
- Prescrição de medicamentos controlados segue exigências do CFO/Anvisa
  (validar necessidade de assinatura digital com validade jurídica antes do
  lançamento dessa funcionalidade).
- **Bloqueante antes do primeiro cliente real:** `EmailPort` (001) e
  `EmailNotificacaoCanalAdapter` (011) ainda são implementações console-only
  (log, sem envio real). Escolher provedor de e-mail transacional (ex: Resend,
  Amazon SES, SendGridBrasil) e substituir os adapters antes de onboardar
  qualquer clínica fora do ambiente de teste — sem isso, convites e avisos de
  cobrança nunca chegam ao destinatário real.
