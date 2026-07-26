# 008 — Conexão de WhatsApp por Clínica (Meta Embedded Signup)

## Status
`rascunho`

## Contexto
A plataforma é multi-tenant: cada clínica precisa conectar seu próprio número de
WhatsApp de forma self-service, sem que o time da plataforma configure nada
manualmente por clínica no Meta Business Manager. Meta oferece o fluxo
"Embedded Signup" via programa de Tech Provider para esse cenário exatamente.

## User story
Como dono de clínica, quero conectar meu número de WhatsApp à plataforma em poucos
cliques, para que o bot secretária virtual comece a atender meus pacientes.

## Critérios de aceite
- [ ] Botão "Conectar WhatsApp" no painel abre o popup oficial de Embedded Signup
      da Meta (usando o Configuration ID da plataforma, cadastrado uma única vez
      como Tech Provider).
- [ ] Ao concluir o popup, a plataforma recebe o código OAuth, troca por token de
      acesso de longa duração, e obtém `waba_id` + `phone_number_id`.
- [ ] Plataforma inscreve o webhook para aquele `phone_number_id`.
- [ ] `ClinicWhatsappAccount` é criada/atualizada com status `conectado`.
- [ ] Painel mostra status da conexão (conectado / desconectado / pendente).
- [ ] Token é armazenado criptografado, nunca em texto plano.
- [ ] Existe rotina de verificação/renovação de token antes da expiração.
- [ ] Falha no processo (ex: usuário cancela popup) deixa `ClinicWhatsappAccount`
      em `pendente`, sem quebrar o restante do painel.

## Regras de negócio
- Uma clínica tem no máximo uma `ClinicWhatsappAccount` ativa por vez.
- Token expirado ou revogado força status para `desconectado` e bloqueia envio de
  mensagens até nova conexão.
- Webhook recebido para um `phone_number_id` sem `ClinicWhatsappAccount`
  correspondente é descartado com log (não deve quebrar o processamento de outras
  clínicas).

## Modelo de domínio envolvido
`ClinicWhatsappAccount`.

## Casos de uso (application layer)
- `IniciarConexaoWhatsapp(clinicaId) → ConfiguracaoPopup` (retorna o que o
  frontend precisa para abrir o popup, ex: configuration ID)
- `ConcluirConexaoWhatsapp(clinicaId, codigoOAuth) → ClinicWhatsappAccount`
  (troca código por token, salva conta, inscreve webhook)
- `DesconectarWhatsapp(clinicaId) → void`
- `RenovarTokenWhatsapp(clinicaId) → void` (job periódico)

## Ports necessárias
- `MetaGraphApiPort` (trocarCodigoPorToken, inscreverWebhook, renovarToken)
- `ClinicWhatsappAccountRepositoryPort`
- `CriptografiaPort` (para o token em repouso)

## Contrato de API
- `POST /api/clinicas/:id/whatsapp/conectar` — recebe o código OAuth do frontend,
  chama `ConcluirConexaoWhatsapp`.
- `POST /api/whatsapp/webhook` — endpoint compartilhado entre todas as clínicas,
  roteia por `phone_number_id` (consumido também pela spec 007).

## Fora de escopo
- Fluxo "Coexistence" (conectar número que já usa WhatsApp Business app comum)
  — avaliar em versão futura se houver demanda.
- Onboarding acima de 200 clínicas/semana (exigiria virar Meta Business Partner).

## Plano de testes
- Domínio: só existe uma `ClinicWhatsappAccount` ativa por clínica.
- Aplicação: `ConcluirConexaoWhatsapp` com código inválido não cria conta e
  retorna erro tratável.
- Integração: adapter real de troca de código por token (usar sandbox/mocks da
  Graph API em teste).
- Contrato: webhook para `phone_number_id` desconhecido não derruba o endpoint.

## Dependências
001 (auth multi-tenant). Bloqueia 007 (bot depende de conta conectada).
