# 011 — Notificações (módulo central)

## Status
`aprovada`

## Contexto
Vários módulos do Dentyvo precisam avisar usuários (e-mail e/ou painel) sem
cada um reinventar envio, persistência e leitura de “não lidas”. Hoje existem
mecanismos isolados: `EmailPort` na feature 001 (convite) e `LembretePort`
stub na feature 002 (lembrete de consulta). Casos novos — aviso de aumento de
preço pós-promoção, trial acabando e cobrança vencida (feature 010) — precisam
de um canal reutilizável em `core/notificacao`, alinhado à arquitetura
hexagonal e ao princípio de **não persistir PHI/dado clínico** no conteúdo
(mesmo espírito de `DetalheAuditoria` / campo `detalhe` da feature 003).

## User story
Como produto/plataforma, quero um módulo central de notificações com canais
reutilizáveis (e-mail e in-app), para que assinatura, agendamento e demais
módulos possam avisar usuários de forma consistente, auditável e sem embutir
dado clínico no payload.

## Decisões aprovadas (Planejador)

| # | Decisão | Valor |
|---|---|---|
| 1 | Retenção | Acumulam **indefinidamente** no MVP; purge (ex.: lidas > 90 dias) = débito |
| 2 | Anti-spam | **Dedup** por `tipo` + destinatário + `chaveNegocio` na janela de **1 hora** (não rate limit genérico) |
| 3 | Falha de envio | Status `pendente` \| `enviada` \| `falhou` para observabilidade; **sem** retry automático no MVP |
| 4 | RBAC | Cada um só vê/marca as **próprias**; sem inbox cross-tenant para super-admin |
| 5 | UI in-app | **Polling/refetch** via server action; sem WebSocket/SSE nesta feature |
| 6 | Conteúdo | Sem PHI/dado clínico (mesmo espírito de `detalhe` da 003) |
| 7 | Auditoria (R1) | `AuditoriaLogPort` registra **apenas falhas** de envio (`statusEnvio → falhou`). **Nunca** audita sucesso (`enviada`) no MVP |

## Decisões de auditoria (Arquiteto — aprovadas)

| # | Tema | Decisão |
|---|---|---|
| R1 | Quando auditar | Só em **falha** de canal. Nunca em sucesso no MVP. |
| R2 | Ator incompleto | Se `atorUsuarioId` está presente mas faltam ambos (ou há XOR inválido) entre `atorProfissionalId` e `atorUsuarioPlataformaId`, a auditoria de falha é **ignorada** (não lança erro de domínio — não derruba o envio) e emite `console.warn` no servidor com `notificacaoId` para rastreio |

## Critérios de aceite
- [ ] Existe módulo `src/core/notificacao` (domain / application / infra) com
      entidade persistida `Notificacao`.
- [ ] `Notificacao` registra: destinatário (`destinatarioUsuarioId` **ou**
      `destinatarioUsuarioPlataformaId`), `tipo`, `canal`, `conteudo` (sem
      PHI/dado clínico), `chaveNegocio` (quando aplicável), status de envio
      (`pendente` \| `enviada` \| `falhou`), status lida/não lida, `criadaEm`.
- [ ] Conteúdo da notificação contém apenas metadados / textos operacionais
      (ex.: ids de assinatura, nome do plano, datas de cobrança, link de
      ação) — **nunca** dados clínicos de paciente, anamnese, evolução ou
      receita (mesmo princípio de `detalhe` em auditoria, feature 003).
- [ ] `NotificacaoPort` (ou ports de canal compostas sob ela) cobre no MVP
      pelo menos dois canais: **e-mail** e **in-app** (painel).
- [ ] `EnviarNotificacao(destinatario, tipo, conteudo, canais[], chaveNegocio?)`
      persiste a notificação e despacha pelos canais solicitados; se já
      existir envio com o mesmo `tipo` + destinatário + `chaveNegocio` criado
      na janela de **1 hora**, é **deduplicado** (não reenvia — retorna a
      existente ou no-op documentado pelo Arquiteto).
- [ ] Status de envio por canal: inicia `pendente`, passa a `enviada` ou
      `falhou` conforme resultado do adapter; **sem** retry automático no MVP.
- [ ] `ListarNotificacoesNaoLidas` retorna apenas as não lidas do **próprio**
      destinatário autenticado (usuário de clínica ou `UsuarioPlataforma`).
- [ ] `MarcarComoLida(notificacaoId)` marca como lida somente se o solicitante
      for o destinatário da notificação (autorização via
      `src/core/shared/autorizacao`).
- [ ] Super-admin **não** tem inbox cross-tenant: não lista nem marca
      notificações de usuários de clínicas; só as próprias (se houver
      `destinatarioUsuarioPlataformaId` dele).
- [ ] Canal in-app consumido por **polling/refetch** via server action (ex.:
      ao abrir o painel ou em intervalo simples); sem WebSocket/SSE nesta
      feature.
- [ ] Notificações **não** são apagadas automaticamente no MVP (retenção
      indefinida).
- [ ] Tipos de notificação previstos (enum / catálogo inicial, expansível):
      - `aviso_aumento_preco` — pós-promoção (consumidor futuro na 010)
      - `lembrete_consulta` — agendamento (débito: hoje stub em `LembretePort`)
      - `trial_acabando` — assinatura (010)
      - `cobranca_vencida` — assinatura (010)
      - `convite_usuario` — auth (débito: hoje `EmailPort` isolado na 001)
- [ ] **Novos** casos de uso que precisem notificar (ex.: aviso de preço,
      trial acabando, cobrança vencida) **nascem já** consumindo este módulo.
- [ ] Módulos com mecanismo próprio já funcionando (`EmailPort` em auth,
      `LembretePort` em agendamento) **não** são migrados nesta feature —
      registrados como débito técnico / refatoração futura, **não bloqueante**.
- [ ] Erros de domínio reutilizam o padrão de `src/core/shared` (erros
      específicos, não `Error` genérico).
- [ ] Envio relevante (pelo menos falhas e, se fizer sentido, envios de tipos
      sensíveis à operação comercial) pode registrar trilha via
      `AuditoriaLogPort` (003) com metadados sem PHI — decisão fina de *quando*
      auditar fica para o Arquiteto; a port deve estar disponível para reuso.

## Regras de negócio
- Destinatário é exatamente um de: usuário de clínica (`destinatarioUsuarioId`)
  **ou** usuário da plataforma (`destinatarioUsuarioPlataformaId`) — nunca
  ambos, nunca nenhum.
- Conteúdo **não** pode carregar PHI / dado clínico (invariante de domínio /
  validação na application).
- Só o destinatário vê e marca a própria notificação como lida (RBAC:
  sem leitura cross-usuário / cross-tenant de inbox).
- Deduplicação: mesmo `tipo` + mesmo destinatário + mesma `chaveNegocio`
  (ex.: `cobrancaId`, `conviteId`, `assinaturaId`) dentro de **1 hora** não
  gera novo envio. Sem `chaveNegocio`, a dedup por identidade de evento não
  se aplica (produtores de eventos únicos devem passar a chave quando
  existir id de origem). Isso **não** é rate limit genérico por volume.
- Status de envio `pendente` \| `enviada` \| `falhou` é persistido para
  observabilidade/auditoria. Falha em um canal (ex.: e-mail) não apaga o
  registro in-app já persistido se ambos foram solicitados; **não** há
  retry automático no MVP.
- Retenção: registros acumulam indefinidamente no MVP (sem purge automático).
- Canais fora do MVP (WhatsApp push, SMS, etc.) não entram nesta spec.

### Limitação conhecida — balde fixo de 1h (não janela deslizante)

A dedup usa **balde horário fixo** (`janelaDedup = floor(criadaEm / 1h)`),
não uma janela deslizante de 60 minutos a partir do último envio.

**Por quê:** viabilizar UNIQUE atômica no banco (mesmo padrão de constraint
das features 002/003). Janela deslizante pura não cabe numa constraint
estática sem lock/serialização mais cara.

**Trade-off aceito:** dois envios da mesma identidade de evento em baldes
vizinhos (ex.: 12:59 e 13:01) **não** são deduplicados. Isso **não** é bug
a corrigir depois — é limitação consciente. O objetivo real (conter loop de
spam / reenvio em corrida no mesmo balde) continua atendido na prática.

## Modelo de domínio envolvido
Nova entidade (registrar também em `specs/02-domain-model.md` na etapa do
Arquiteto de Domínio):

### Notificacao
- `id`
- `destinatarioUsuarioId` (nullable) **ou** `destinatarioUsuarioPlataformaId`
  (nullable) — XOR
- `tipo` (`aviso_aumento_preco` | `lembrete_consulta` | `trial_acabando` |
  `cobranca_vencida` | `convite_usuario` | …)
- **Decisão do Arquiteto (agregado de domínio):** um `Notificacao` = um
  evento lógico; `envios` no domínio é a coleção de status por canal
  (`email` | `in_app`)
- **Decisão do Arquiteto (persistência):** `envios` → tabela normalizada
  separada (ex.: `notificacao_envio`: `notificacaoId`, `canal`,
  `statusEnvio`), **não** coluna JSON/array embutida na linha de
  `notificacao`. Com retenção indefinida no MVP (sem purge), evitar blob
  que cresça/mute por linha; cardinalidade por notificação é limitada aos
  canais MVP (no máximo 2 hoje)
- `chaveNegocio` (nullable) — id opaco do evento de origem (ex. cobrancaId)
- `janelaDedup` — balde fixo `floor(criadaEm / 1h)` para UNIQUE atômica
  (ver limitação conhecida acima)
- `conteudo` (`ConteudoNotificacao` allowlist — **sem PHI**)
- `lida` / `lidaEm` / `criadaEm`

**Dedup (Arquiteto):** regra de domínio `Notificacao.ehDuplicataDe` + port
`criarSeNaoDuplicada` atômica com constraint de banco (mesmo padrão 002/003).
Checagem otimista sozinha **não** basta contra corrida.

Relaciona-se com consumidores em: `Assinatura` / `Plano` / `Cobranca` (010),
`Agendamento` (002), `Convite` (001) — apenas como *produtores* de eventos de
notificação, sem acoplar domínio clínico ao módulo.

## Casos de uso (application layer)
- `EnviarNotificacao(destinatario, tipo, conteudo, canais[], chaveNegocio?) → Notificacao | Notificacao[]`
- `ListarNotificacoesNaoLidas(destinatario) → Notificacao[]`
  (destinatário = sessão; sem parâmetro arbitrário de outro usuário)
- `MarcarComoLida(notificacaoId) → Notificacao`

Identidade do ator para listar/marcar vem de `ContextoSessao` (001) /
equivalente de plataforma (009), não de IDs soltos sem checagem de
autorização.

### Consumidores previstos (não todos implementados nesta feature)
| Origem | Tipo | Quando nasce no módulo 011 |
|---|---|---|
| 010 (promoção / preço) | `aviso_aumento_preco` | Sim — quando a sub-feature de promoção for especificada/implementada |
| 010 (assinatura) | `trial_acabando`, `cobranca_vencida` | Sim — novos fluxos de aviso |
| 002 (agendamento) | `lembrete_consulta` | Não agora — débito técnico (`LembretePort` stub) |
| 001 (auth) | `convite_usuario` | Não agora — débito técnico (`EmailPort`) |

## Ports necessárias
- `NotificacaoPort` (genérica) — envio multi-canal e/ou composição de:
  - canal **e-mail**
  - canal **in-app** (persistência + leitura no painel)
- `NotificacaoRepositoryPort` (persistência, listagem de não lidas, marcar
  lida, consulta de dedup por tipo+destinatário+chaveNegocio na janela)
- Reuso: erros e `criarVerificadorAutorizacao` / autorização de
  `src/core/shared`
- Reuso opcional mas previsto: `AuditoriaLogPort` (003) para histórico de
  envios / falhas com metadados sem PHI

Schema Drizzle esperado (orientação): arquivo dedicado
`db/schema/notificacao.ts` (não misturar com schema clínico).

## Contrato de API / Server Action (se aplicável)

| Fluxo | Camada | Entrada (alto nível) | Saída |
|---|---|---|---|
| Listar não lidas | Server Action (autenticada) | (sessão) | lista de `Notificacao` do próprio usuário |
| Marcar como lida | Server Action (autenticada) | `notificacaoId` | `Notificacao` atualizada |
| Enviar | Interno (outros use cases / jobs) | destinatário, tipo, conteúdo, canais, chaveNegocio? | persistido + despacho (ou dedup) |

UI in-app: indicador / lista no painel via **polling/refetch** da server
action de listagem (ao carregar a rota e/ou intervalo simples). Sem
WebSocket, SSE ou push em tempo real nesta feature.

## Fora de escopo
- Migração de `EmailPort` (001) e `LembretePort` (002) para este módulo —
  **débito técnico explícito**, não bloqueante; fora do MVP desta feature.
- Canais WhatsApp / SMS / push nativo.
- WebSocket / SSE / realtime para inbox in-app.
- Templates de e-mail sofisticados / i18n avançado (MVP: conteúdo estruturado
  suficiente para o tipo).
- Rate limit genérico por volume (máx. N e-mails/hora) — só dedup por
  identidade de evento.
- Retry automático / fila de reenvio de `falhou` (débito técnico).
- Purge / retenção com TTL (débito técnico).
- Preferências granulares do usuário (“não quero e-mail de X”) — fora do MVP.
- Implementação da promoção de lançamento / job de aviso de preço (010) —
  apenas o **canal** fica pronto; o job consumidor depende da sub-feature de
  promoção e desta 011 implementada.
- Inbox cross-tenant no painel super-admin (ler notificações de usuários de
  clínicas).

## Plano de testes
- Domínio: rejeitar conteúdo com campos clínicos / PHI quando houver validação
  explícita; XOR de destinatário; só destinatário marca como lida.
- Domínio/aplicação: segundo `EnviarNotificacao` com mesmo tipo + destinatário
  + `chaveNegocio` dentro de 1h é deduplicado (não dispara novo e-mail).
- Aplicação: `EnviarNotificacao` persiste com `statusEnvio` e atualiza para
  `enviada` ou `falhou` conforme port fake; sem retry após `falhou`.
- Aplicação: `ListarNotificacoesNaoLidas` filtra por destinatário da sessão e
  `lida=false`; super-admin não lista inbox de usuário de clínica.
- Aplicação: `MarcarComoLida` nega se outro usuário tentar.
- Aplicação: falha de autorização usa erros de `shared`.
- Integração (adapters): e-mail fake/in-memory; persistência in-app.
- Contrato: server actions de listar/marcar respeitam sessão (polling).

## Dependências
- 001 (`ContextoSessao` / identidade de usuário de clínica)
- 003 (`AuditoriaLogPort` — reuso opcional para trilha de envio)
- 009 (destinatário `UsuarioPlataforma`, se houver notificações de
  plataforma)
- Consumidores: 010 (avisos de assinatura / preço), 002 e 001 apenas como
  débito futuro de migração

## Débito técnico (não bloqueante)
1. **001** — convites continuam em `EmailPort`; migrar `convite_usuario` para
   `EnviarNotificacao` em refatoração futura.
2. **002** — lembretes continuam no stub `LembretePort`; migrar
   `lembrete_consulta` para este módulo quando houver envio real.
3. **Purge / retenção** — política de apagar notificações antigas (ex.: lidas
   com mais de 90 dias); não implementada no MVP (acúmulo indefinido).
4. **Retry automático** — fila/job para reenviar notificações com
   `statusEnvio = falhou`; MVP só persiste o status para observabilidade.
5. ~~Atualizar `specs/02-domain-model.md` com a entidade `Notificacao`~~ —
   feito na etapa do Arquiteto de Domínio.
