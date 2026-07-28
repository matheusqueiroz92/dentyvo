# 008 — Conexão de WhatsApp por Clínica (Meta Embedded Signup)

## Status
`aprovada`

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
- [ ] Token é armazenado criptografado em repouso, nunca em texto plano (nem em
      banco, logs ou respostas de API).
- [ ] Existe rotina de verificação/renovação de token antes da expiração
      (`RenovarTokenWhatsapp` via job agendado).
- [ ] Falha no processo (ex: usuário cancela popup) deixa `ClinicWhatsappAccount`
      em `pendente`, sem quebrar o restante do painel.
- [ ] Apenas `admin` da clínica pode iniciar, concluir ou desconectar a conta
      WhatsApp (matriz abaixo).
- [ ] Webhook para `phone_number_id` sem conta correspondente responde sucesso
      (não 5xx), descarta o evento com log e segue processando os demais.

### Matriz de permissões (MVP desta feature)

| Ação | admin | dentista | recepcao | Observação |
|---|---|---|---|---|
| Iniciar conexão WhatsApp | sim | não | não | |
| Concluir conexão WhatsApp | sim | não | não | |
| Desconectar WhatsApp | sim | não | não | |
| Renovar token WhatsApp | — | — | — | Job de sistema; sem RBAC de papel de clínica |

## Regras de negócio
- Uma clínica tem no máximo uma `ClinicWhatsappAccount` ativa por vez.
- Token expirado ou revogado força status para `desconectado` e bloqueia envio de
  mensagens até nova conexão.
- Uma `ClinicWhatsappAccount` só pode estar `conectado` se tiver
  `accessToken` criptografado e `tokenExpiraEm` válidos.
- Webhook recebido para um `phone_number_id` sem `ClinicWhatsappAccount`
  correspondente é descartado com log (não deve quebrar o processamento de outras
  clínicas nem falhar o endpoint).

## Modelo de domínio envolvido
`ClinicWhatsappAccount` (`id`, `clinicaId`, `wabaId`, `phoneNumberId`,
`accessToken` criptografado, `status` pendente|conectado|desconectado,
`conectadoEm`, `tokenExpiraEm`).

## Casos de uso (application layer)
- `IniciarConexaoWhatsapp(clinicaId) → ConfiguracaoPopup` (retorna o que o
  frontend precisa para abrir o popup, ex: configuration ID)
- `ConcluirConexaoWhatsapp(clinicaId, codigoOAuth) → ClinicWhatsappAccount`
  (troca código por token, salva conta, inscreve webhook)
- `DesconectarWhatsapp(clinicaId) → void`
- `RenovarTokenWhatsapp(clinicaId) → void` (job periódico; sem checagem de papel)

## Ports necessárias
- `MetaGraphApiPort` (trocarCodigoPorToken, inscreverWebhook, renovarToken)
- `ClinicWhatsappAccountRepositoryPort`
- `CriptografiaPort` (para o token em repouso)

## Contrato de API
- `POST /api/clinicas/:id/whatsapp/conectar` — recebe o código OAuth do frontend,
  chama `ConcluirConexaoWhatsapp`.
- `POST /api/whatsapp/webhook` — endpoint compartilhado entre todas as clínicas,
  roteia por `phone_number_id` (consumido também pela spec 007).
  - `phone_number_id` desconhecido: log + discard; resposta HTTP de sucesso
    (Meta não deve retentar por erro nosso de roteamento).
  - Validação da assinatura/verify token do webhook permanece obrigatória antes
    de processar o payload.

## Decisões aprovadas

1. **Credenciais do Tech Provider (plataforma):** armazenadas **somente em
   variáveis de ambiente** (nunca no banco por clínica). Variáveis:
   `META_APP_ID`, `META_APP_SECRET`, `META_EMBEDDED_SIGNUP_CONFIG_ID`,
   `META_WEBHOOK_VERIFY_TOKEN` (ver `.env.example`). O Configuration ID é da
   plataforma como Tech Provider; cada clínica só conecta o próprio número via
   Embedded Signup.
2. **Criptografia do token em repouso:** o access token da clínica é
   criptografado via `CriptografiaPort` antes de persistir em
   `ClinicWhatsappAccount.accessToken`. Texto plano existe só transitório na
   application ao falar com a Graph API; nunca em logs, dumps nem respostas de
   API/UI.
3. **Job de renovação de token:**
   - Disparo periódico via **Upstash QStash** e/ou **Vercel Cron** (stack em
     `specs/01-architecture.md`).
   - Antecedência padrão: **7 dias** antes de `tokenExpiraEm`.
   - Fluxo: listar contas `conectado` com `tokenExpiraEm` dentro da janela →
     para cada `clinicaId`, executar `RenovarTokenWhatsapp(clinicaId)`.
   - Falha na renovação (token revogado/inválido na Meta): status →
     `desconectado`, token limpo, envio bloqueado até nova conexão.
   - Sem RBAC de `Profissional` — ator é o scheduler.
4. **Webhook com `phone_number_id` desconhecido:** descartar com log; não
   lançar erro que derrube o processamento em lote nem retorne 5xx ao Meta;
   demais entradas do mesmo payload continuam normalmente.
5. **RBAC:** só `admin` inicia/conclui/desconecta; renovação é job (ver matriz).

## Fora de escopo
- Fluxo "Coexistence" (conectar número que já usa WhatsApp Business app comum)
  — avaliar em versão futura se houver demanda.
- Onboarding acima de 200 clínicas/semana (exigiria virar Meta Business Partner).

## Plano de testes
- Domínio: só existe uma `ClinicWhatsappAccount` ativa por clínica; status
  `conectado` exige token criptografado + `tokenExpiraEm`; token inválido força
  `desconectado`.
- Aplicação: `ConcluirConexaoWhatsapp` com código inválido não deixa conta
  `conectado` e retorna erro tratável; RBAC nega dentista/recepção.
- Integração: adapter real de troca de código por token (usar sandbox/mocks da
  Graph API em teste); token persistido só como ciphertext.
- Contrato: webhook para `phone_number_id` desconhecido não derruba o endpoint
  (sucesso + log).

## Dependências
001 (auth multi-tenant). Bloqueia 007 (bot depende de conta conectada).
