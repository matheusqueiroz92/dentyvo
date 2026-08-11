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
4. Receituário com modelo padrão; **atestado odontológico** (extensão
   documentada em `specs/features/006b-atestado.md`, spec `aprovada` —
   mesma arquitetura de emissão imutável + PDF da 006).
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

Registro de frentes **pós-lançamento inicial** (sem abrir Arquiteto nem
implementação agora). Detalhes nas seções correspondentes abaixo.

- **013 — Financeiro:** ver seção detalhada abaixo. Até a spec formal existir,
  o dashboard deve **omitir** cartões de faturamento resumido e contas
  vencidas referenciados em `docs/DESIGN_SYSTEM.md` (seção 8), sem simular
  ou mockar dado financeiro.
- **014 — Estoque/Insumos:** ver seção detalhada abaixo. Sem urgência de
  schema agora — módulo desenhável do zero quando chegar a vez.
- **015 — Orçamento:** ver seção detalhada abaixo. Candidato a próxima
  spec após Prontuário — complexidade baixa/média, valor comercial
  direto. **Sem abrir Arquiteto agora.**
- **016 — Transcrição de voz assistida (anamnese):** ver seção detalhada
  abaixo. **v2**, após módulos clínicos centrais estarem maduros.
- **017 — Sugestão de tratamento por IA:** ver seção detalhada abaixo.
  Apenas **ideia em avaliação** — **não** é spec ativa; bloqueada até
  consulta jurídica/regulatória.
- **018 — Chatbot de suporte à plataforma:** ver seção detalhada abaixo.
  Assistente de **uso do produto** (não clínico). **Não priorizar** antes
  do lançamento comercial — aguardar volume real de dúvidas das primeiras
  clínicas. **Não confundir** com o bot WhatsApp de pacientes (007).
- **019 — Anexos de exame no prontuário:** ver seção detalhada abaixo.
  Upload de imagens (ex.: radiografias) via Vercel Blob já existente, com
  ferramenta de anotação/desenho sobre a imagem. Extensão da 003 —
  **fora do escopo do odontograma (004)**. **Sem abrir Arquiteto agora.**
- **Gravação de paciente pré-consulta (link público/WhatsApp):** ver
  seção detalhada abaixo. Ideia **rejeitada** no formato de link público;
  se revisitada no futuro, só sob restrições fortes (nunca no MVP).
- **Multi-clínica por usuário — v2:** ver seção detalhada abaixo. Um usuário
  podendo pertencer a múltiplas clínicas, com seletor de unidade no topbar
  (`docs/DESIGN_SYSTEM.md`, seção 9). **Depois do lançamento inicial.**
- **Portal do paciente — v2:** ver seção detalhada abaixo. Acesso autenticado
  do próprio paciente a dados clínicos. **Depois do lançamento inicial.**

## Próxima adição de escopo (não é v2 distante)

- **Agendamento via link público (extensão da 002):** ver seção detalhada
  abaixo. Spec da emenda **aprovada** em
  `specs/features/002-agendamento.md` — pronta para o Arquiteto;
  implementação ainda pendente. Baixo custo relativo ao que já existe em
  `core/agendamento`.

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

## Orçamento — planejamento futuro (spec 015)

Registro **conceitual** (sem spec formal ainda). **Não abrir Arquiteto
nem implementação agora.**

Modelo similar a Receita (006): vinculado a prontuário, com itens
(procedimento + valor em snapshot) e workflow de status
(`rascunho` | `enviado` | `aceito` | `recusado`). Possivelmente gera
origem nova de `Agendamento` quando aceito (detalhe na spec formal).

Candidato a **próxima spec após Prontuário** — complexidade baixa/média,
valor comercial direto. A spec formal (`specs/features/015-*.md`) só
será aberta quando for a hora de planejar a entrega.

## Transcrição de voz assistida (anamnese) — planejamento futuro (spec 016)

Registro **conceitual** (sem spec formal ainda). **v2** — depois que os
módulos clínicos centrais estiverem maduros.

- Gravação pelo dentista **durante** a consulta.
- Transcrição via API (Whisper / Deepgram / similar).
- Resultado **sempre** como rascunho editável antes de salvar — **nunca**
  preenchimento automático sem revisão humana.

Não confundir com gravação feita pelo paciente fora do consultório (ideia
rejeitada no formato de link público — ver seção abaixo).

## Sugestão de tratamento por IA — ideia em avaliação (017)

**Não é spec ativa.** Registrar apenas como ideia sob avaliação.

Requer consulta jurídica/regulatória (possível enquadramento como suporte
à decisão clínica / dispositivo médico) **antes** de qualquer
especificação técnica. **Bloqueado** até essa avaliação acontecer —
não numerar como entrega planejada nem abrir `specs/features/017-*.md`
enquanto o bloqueio permanecer.

## Chatbot de suporte à plataforma — planejamento futuro (spec 018)

Registro **conceitual** (sem spec formal ainda). **Não abrir Arquiteto
nem implementação agora.** **Não priorizar** antes do lançamento
comercial.

Assistente conversacional **dentro do produto** para dúvidas de **uso da
plataforma** (como configurar agenda, convites, assinatura, etc.) —
**não** dúvidas clínicas. **Não confundir** com o bot de WhatsApp para
pacientes (007).

### Timing

Aguardar volume real de dúvidas de suporte das primeiras clínicas para
construir conteúdo relevante. Sem base empírica pós-lançamento, a
especificação formal (`specs/features/018-*.md`) não deve ser aberta.

### Requisitos de escopo obrigatórios (quando especificado de verdade)

- **Base de conhecimento real:** gerada a partir de dúvidas reais
  pós-lançamento — não FAQs hipotéticas inventadas no planejamento.
- **Recusa explícita e redirecionamento** para qualquer pergunta de
  natureza clínica: nunca responder sobre tratamento, medicação,
  dosagem (mesmo que o usuário peça).
- Considerar como **diferencial do plano Full** (010).

## Anexos de exame no prontuário — planejamento futuro (spec 019)

Registro **conceitual** (sem spec formal ainda). **Não abrir Arquiteto
nem implementação agora.**

Extensão do **prontuário (003)** — **não** do odontograma (004). Serve
para anexar exames de imagem (radiografias panorâmicas/periapicais,
fotos clínicas, etc.) ao prontuário do paciente, com possibilidade de
**anotar/desenhar** sobre a imagem (referência de produto: fluxo tipo
Codental com radiografia panorâmica anotável).

### Infraestrutura a reaproveitar

- Upload via **Vercel Blob** já decidido em `specs/01-architecture.md`
  (logo da clínica hoje; mesma seção prevê reaproveitamento para anexos
  de prontuário).
- Padrão: upload na delivery (server action autenticada) → URL no
  domínio; o domínio **não** conhece o Blob.
- Até a spec formal: **não** criar tabela/entidade de anexo “por
  antecipação”.

### Decisões abertas (para a spec formal `019-*.md`)

- **Vínculo:** anexos como extensão de `Evolucao` **ou** entidade
  própria ligada a `Prontuario` (e, opcionalmente, a uma evolução) —
  escolher na spec formal com base em ciclo de vida, retificação e
  auditoria.
- Formato/persistência das **anotações** (overlay vetorial vs. raster
  “achatado”; versionamento se o dentista editar de novo).
- Tipos de arquivo aceitos, limites de tamanho e retenção LGPD.
- RBAC alinhado à 003 (`admin` + `dentista`; recepção sem acesso a
  conteúdo clínico, salvo decisão explícita na spec).

### Fora de escopo deste registro

- Odontograma/periograma (004/005) — mapas por dente/face e sondagem.
- Spec formal completa, ports, schema ou UI de anotação.
- Qualquer avanço para o Arquiteto de Domínio.

## Gravação de paciente pré-consulta — ideia rejeitada (link público)

Ideia **rejeitada** para o formato de **link público**: risco de
consentimento e de triagem de emergência sem supervisão humana.

Se revisitada no futuro:
- restringir a canal **WhatsApp** com relação já estabelecida;
- revisão humana **obrigatória** antes de qualquer processamento por IA;
- **nunca** no MVP nem no canal público de agendamento.

## Multi-clínica por usuário — planejamento futuro (v2)

Registro **conceitual** (sem spec formal ainda). **Depois do lançamento
inicial.**

Hoje a spec 001 fixa: *“Um usuário pertence a exatamente uma clínica no MVP
(sem multi-clínica)”* — decisão explícita de escopo do auth multi-tenant.
Esta frente **reabre essa decisão** e exige feature dedicada (número a
definir quando a spec formal for aberta), não um ajuste cosmético de UI.

### Escopo previsto

- Um mesmo usuário (credencial) pode ser membro de **mais de uma** clínica
  (`Profissional` por tenant, ou modelo equivalente).
- Seletor de unidade/clínica no **topbar** — já previsto em
  `docs/DESIGN_SYSTEM.md` (seção 9: “alternância de unidade, quando
  multiunidade”).
- Sessão passa a carregar a clínica **ativa** escolhida pelo usuário
  (troca de contexto sem novo login).

### Impactos conhecidos no código/domínio atual

- **`AceitarConvite`:** hoje lança `UsuarioJaVinculadoAClinicaError` quando o
  e-mail/usuário já está vinculado a uma clínica — essa invariante do MVP
  precisa ser relaxada ou substituída (aceitar vínculo adicional vs. bloquear).
- **`ContextoSessao`:** hoje assume um único `clinicaId` da sessão; multiunidade
  exige clínica ativa (e, possivelmente, lista de clínicas acessíveis).
- **Billing (010):** assinatura/cobrança é por clínica — validar se o modelo
  atual permanece (provável: sim) e como o seletor interage com
  `VerificarAcessoAtivo` / bloqueio por tenant.
- Isolamento multi-tenant e RBAC por papel **permanecem por clínica**; o que
  muda é a cardinalidade usuário↔clínica.

Não implementar seletor “vazio” no topbar enquanto esta frente não tiver
spec aprovada.

## Portal do paciente — planejamento futuro (v2)

Registro **conceitual** (sem spec formal ainda). **Depois do lançamento
inicial.**

Hoje `Paciente` em `core/paciente` é **dado clínico** (CRUD da clínica),
sem conta de login. O portal exige um **novo ator de autenticação**: o
próprio paciente com identidade própria (distinto de `Profissional` /
`UsuarioPlataforma`).

### Escopo previsto

- Acesso autenticado do paciente a: prontuário, odontograma, periograma e
  receitas (leitura e, se a spec formal definir, ações limitadas).
- Fluxo de **consentimento LGPD** específico do portal (dado sensível de
  saúde — além do consentimento operacional já previsto no MVP da clínica).
- **RBAC própria** do ator paciente (não reutilizar matriz admin/dentista/
  recepção).

### Dependências / riscos

- Novo módulo ou extensão de auth (sessão paciente ≠ sessão profissional).
- Escopo de leitura/exportação e auditoria alinhados à LGPD.
- Não confundir com o bot WhatsApp (007) nem com o link público de
  agendamento (este último não autentica o paciente como ator clínico).

## Agendamento via link público — próxima adição de escopo (002)

Registro de **próxima** extensão de produto — **não** tratar como v2
distante. A spec formal pode ser um adendo/atualização de
`specs/features/002-agendamento.md` (ou feature numerada curta que a
estenda), quando for a hora de planejar a entrega.

### Por que o custo é baixo

- O campo `Agendamento.origem` já admite `link-publico` desde a modelagem
  original da 002 (domínio e critérios de aceite).
- Overbooking, disponibilidade, duração e RBAC interno **já** estão no
  núcleo de `core/agendamento`; o canal público deve **reutilizar**
  `MarcarConsulta` (ou equivalente) com `origem: "link-publico"`, sem
  duplicar regra de negócio.

### O que falta (implementação — spec aprovada)

- Entrega pelo fluxo SDD a partir da emenda aprovada em
  `specs/features/002-agendamento.md` (*Emenda — Agendamento via link
  público*): rotas públicas, slugs, menu curto, caso(s) de uso do canal,
  rate limit + CAPTCHA, gates `ativa` + `VerificarAcessoAtivo`.

### Relação com a 002 atual

Emenda formal em `specs/features/002-agendamento.md` (*Emenda —
Agendamento via link público*), status **`aprovada`** — decisões
consolidadas (slug clínica/profissional, paciente por CPF sem
sobrescrita, menu público 2–4, dois formatos de link, reuso de
`ListarHorariosDisponiveis`, abuso MVP, `ContextoAgendamentoPublico`).
**Pronta para o Arquiteto de Domínio.**

## Restrições e conformidade

- LGPD: dado de saúde é dado sensível — exige consentimento explícito,
  criptografia em repouso para dados clínicos e tokens de integração, e log de
  auditoria de acesso ao prontuário.
- Prescrição de medicamentos controlados segue exigências do CFO/Anvisa
  (validar necessidade de assinatura digital com validade jurídica antes do
  lançamento dessa funcionalidade).
### Itens bloqueantes pré-lançamento (primeiro cliente real)

Antes de onboardar qualquer clínica fora do ambiente de teste:

1. **Provedor de e-mail real:** `EmailPort` (001) e
   `EmailNotificacaoCanalAdapter` (011) ainda são implementações
   console-only (log, sem envio real). Escolher provedor de e-mail
   transacional (ex: Resend, Amazon SES, SendGridBrasil) e substituir os
   adapters — sem isso, convites e avisos de cobrança nunca chegam ao
   destinatário real.
2. **Vercel Cron (e/ou QStash):** jobs periódicos necessários ao produto
   (avisos de aumento de preço da promoção 012, lembretes/renovação
   previstos na arquitetura) devem estar autenticados e operacionais em
   produção — ver `specs/01-architecture.md` e specs 011/012.
3. **Revisão jurídica LGPD/saúde:** os documentos em `/termos`,
   `/privacidade` e `/cookies` são **modelos estruturais** com aviso
   visível na UI. **TODO bloqueante:** validação por profissional
   jurídico especializado em LGPD/saúde (incluindo papéis
   controladora/operadora, bases legais, foro, DPO e textos de promoção)
   **antes** do lançamento comercial. Remover o aviso
   `AvisoDocumentoNaoRevisado` somente após essa confirmação.
