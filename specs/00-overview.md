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

## Restrições e conformidade

- LGPD: dado de saúde é dado sensível — exige consentimento explícito,
  criptografia em repouso para dados clínicos e tokens de integração, e log de
  auditoria de acesso ao prontuário.
- Prescrição de medicamentos controlados segue exigências do CFO/Anvisa
  (validar necessidade de assinatura digital com validade jurídica antes do
  lançamento dessa funcionalidade).
