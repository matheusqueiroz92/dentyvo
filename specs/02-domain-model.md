# Modelo de Domínio

Entidades centrais e suas relações. Nomes de tabelas/entidades devem seguir esses
termos (português), conforme `.cursor/rules/code-standards.mdc`.

## Entidades principais

### Clinica (tenant)
- id, nome, endereço, documento fiscal (`tipoDocumento`: `cpf`|`cnpj` + valor
  normalizado; exatamente um dos dois — autônomos podem usar CPF), plano de
  assinatura (spec 010), status (`ativa`|`inativa`; cadastro inicia como `ativa`),
  `logoUrl` (string | null — URL pública do logo; upload via Vercel Blob, ver
  `specs/01-architecture.md`), `tema` (`azul-padrao` | `verde` | `roxo` |
  `grafite` | null — null = padrão da UI; paletas com contraste WCAG 2.2 AA)
- **Documento fiscal é imutável após criação** (identidade/deduplicação do
  tenant — spec 001, emenda `AtualizarClinica`; mesma justificativa do CPF
  em `AtualizarPaciente`). Admin da clínica atualiza só `nome` e/ou
  `endereco` (pelo menos um). Correção de documento = fluxo separado
  (suporte / 009). `EditarClinica` (009) também não altera documento.

### Profissional
- id, clinicaId, nome, papel (`admin`|`dentista`|`recepcao`), cro (obrigatório
  se `dentista`), especialidade (opcional), usuarioId (auth BetterAuth)

### Convite
- id, clinicaId, email, papel (`admin`|`dentista`|`recepcao`), token, expiresAt
  (TTL 72h), aceitoEm (nullable), convidadoPorUsuarioId
  — uso único; ver feature 001

### Paciente
- id, clinicaId, nome, cpf, telefone (WhatsApp), dataNascimento, contatoEmergencia
- `consentimentoLgpd?` (nullable) — `{ aceitoEm, versaoTermo, finalidades[] }`
  com finalidades `tratamento_clinico` | `comunicacao_lembretes` |
  `comunicacao_marketing`; ver feature 002 (emenda aprovada; captura no
  cadastro / `RegistrarConsentimentoPaciente`; ausência não bloqueia
  atendimento clínico — LGPD art. 11, II, f)

### Agendamento
- id, clinicaId, pacienteId, profissionalId, procedimentoId, dataHoraInicio,
  dataHoraFim, status (pendente|confirmado|cancelado|realizado|faltou),
  origem (painel|whatsapp-bot|link-publico)

### Procedimento
- id, clinicaId, nome, duracaoPadraoMinutos, valor

### Prontuario
- id, clinicaId, pacienteId, criadoEm
- Evolucoes[]: registros de atendimento (data, profissionalId, descrição,
  procedimentoId?, agendamentoId?)
  - `agendamentoId` (opcional, nullable): vínculo com o `Agendamento` que
    originou o registro clínico, quando aplicável; null em evoluções fora
    do fluxo de consulta agendada (ex.: retorno espontâneo). Preparação
    para a spec 013 (rastrear visita → cobrança). Ver feature 003 —
    **aprovado para o Arquiteto** na próxima alteração do módulo
    `prontuario`.

### Anamnese
- id, prontuarioId, respostas (estruturado: histórico médico, alergias,
  medicações em uso, condições preexistentes), preenchidoEm, preenchidoPor

### Receita
- id, clinicaId, prontuarioId, profissionalId, emitidaEm,
  itens[] (`ItemReceita`: medicamento, dosagem, posologia, duracao — textos
  livres estruturados),
  snapshot de cabeçalho persistido na emissão (`SnapshotCabecalhoDocumento`
  — mesmos campos da 006: obrigatórios clinicaNome, clinicaEndereco,
  profissionalNome, profissionalCro, pacienteNome, pacienteCpf; opcionais
  pacienteDataNascimento, profissionalEspecialidade; documento fiscal da
  clínica fora do MVP — ver feature 006). Forma JSON da coluna
  `receita.cabecalho` **não muda**.
  assinaturaDigitalId (nullable — v2; assinatura digital fora do MVP)

### SnapshotCabecalhoDocumento (VO compartilhado)
- VO canônico em `src/core/shared` (antes `SnapshotCabecalhoReceita` na 006).
  Alias `SnapshotCabecalhoReceita` permanece no módulo receituário.
  Usado por `Receita`, `Atestado` e `Orcamento`. Rename estrutural apenas —
  sem migração.

### Atestado
- id, clinicaId, prontuarioId, profissionalId, emitidaEm,
  motivo (texto livre obrigatório),
  cid (opcional; se preenchido, formato CID-10 estrutural: letra + 2–3
  dígitos, subcategoria opcional de 1 dígito após ponto; trim + maiúsculas;
  sem catálogo semântico — ver feature 006b),
  período estruturado em data civil UTC: dataInicio, quantidadeDias (≥ 1),
  dataFim inclusiva = dataInicio + (quantidadeDias − 1),
  snapshot `SnapshotCabecalhoDocumento` (mesmo contrato da Receita),
  assinaturaDigitalId (nullable — v2). Sem lista de itens. Imutável após
  emissão; correção = nova emissão. RBAC: só `dentista`.

### Orcamento (feature 015)
- id, clinicaId, prontuarioId, profissionalId, emitidoEm,
  status (`enviado` \| `aceito` \| `recusado` — nasce como `enviado`;
  sem `rascunho` / `expirado` no MVP),
  itens[] (`ItemOrcamento`: procedimentoId, nome snapshot, valor snapshot
  ≥ 0 ajustável na criação, quantidade inteiro ≥ 1; total derivado =
  Σ valor × quantidade),
  snapshot `SnapshotCabecalhoDocumento` (mesmo contrato da Receita/Atestado),
  `validoAte` opcional (data civil informativa — PDF/UI; **não** altera
  status; sem job/cron; sem status `expirado`).
- **Imutabilidade parcial:** conteúdo (itens, cabeçalho, `validoAte`)
  congelado após emissão; só o status transiciona via métodos da entidade
  `aceitar()` / `recusar()` a partir de `enviado` (estados terminais não
  reabrem). Persistência: `OrcamentoRepositoryPort.atualizarStatus` com
  UPDATE condicional `WHERE status = 'enviado'` (0 linhas →
  `OrcamentoStatusConflitoError`). Aceite **não** cria `Agendamento`.
- RBAC comercial: `admin` + `dentista` + `recepcao` (diferente de
  Receita/Atestado). PDF via `GeradorPdfPort.gerarOrcamento`.
- Consome `Procedimento` (002) só como fonte de sugestão nome/valor na
  emissão — leitura via `ProcedimentoRepositoryPort`, sem alterar o módulo
  agendamento.

### Odontograma (v2 — spec 004)
- Fonte de verdade: eventos append-only `EventoOdontograma` (sem snapshot
  completo). Estado vigente = projeção por recência (ver abaixo).
- Ordenação determinística: `registradoEm` asc, depois `sequencia` asc
  (bigserial no banco — desempate monotônico; **não** usar `id` UUID).
- `EventoOdontograma`: id, clinicaId, prontuarioId, numeroDente, nivel
  (`face`|`dente`), face? (obrigatória se nível face), estadoNovo,
  procedimentoId?, registradoEm, profissionalId, sequencia (null só antes
  de persistir; preenchida pelo adapter no insert)
- `salvarEventos`: **atômico (tudo-ou-nada)** — transação explícita no
  adapter; falha em qualquer item ⇒ nenhum evento do lote persiste.
  **Contrato de ordem:** `sequencia` monotônica na ordem do array de
  entrada (índice i < j ⇒ sequencia(i) < sequencia(j)); insert
  **sequencial** na mesma transação — proibido `Promise.all` / inserts
  paralelos do lote. `assertLoteNaoViolaEstadoDenteInteiro` valida nessa
  mesma ordem de array (= ordem futura de `sequencia`).
- `numeroDente`: FDI — permanentes `{11–18,21–28,31–38,41–48}` + decíduos
  `{51–55,61–65,71–75,81–85}`; fora disso → `NumeroDenteInvalidoError`
- Faces: vestibular, lingual_palatina, mesial, distal, oclusal
- `EstadoOdontograma` (enum extensível) em **duas categorias**:
  - **POR FACE** (`nivel = face`): higido, cariado, restaurado, fraturado,
    selante — coexistem entre faces do mesmo dente
  - **DENTE INTEIRO** (`nivel = dente`): ausente_extraido, implante,
    indicado_extracao, protese_coroa, tratamento_endodontico —
    mutuamente exclusivos enquanto vigentes
  - valor na categoria errada para o `nivel` →
    `EstadoIncompativelComNivelError`
- **Projeção bidirecional** (por `numeroDente`):
  - último evento `nivel = dente` **sem** face posterior → `estadoDente`
    vigente e faces sem vigente (limpa faces anteriores);
  - evento `nivel = face` **mais recente** que o último dente inteiro →
    encerra o dente inteiro; faces vigentes = só as posteriores a esse
    corte (sem caso de uso / evento dedicado de “desmarcar”);
  - dois estados de dente inteiro **diferentes** no mesmo dente (lote ou
    vigente) → `EstadoDenteInteiroConflitanteError` (sem sobrescrita
    silenciosa); re-registrar o **mesmo** estado é permitido — **só em
    novos registros**. Ao **ler/projetar** histórico legado que já viole
    essa regra, a projeção **não lança**: o evento de dente mais recente
    (`registradoEm`, `sequencia`) vence
- **Ausência de evento ≠ hígido no domínio:** em
  `projetarOdontogramaVigente` / `OdontogramaVigente`, dente ou face
  **sem nenhum evento** **não** recebe `estado = higido` implícito e
  **não** exige evento explícito de `higido` para “existir”. Comportamento
  oficial:
  - dente nunca tocado → **não entra** em `dentes[]`;
  - face sem evento (ou só eventos anteriores ao último dente inteiro
    ainda vigente / anteriores ao corte) → **não entra** em `faces[]`;
  - `higido` só aparece na projeção quando há **evento append-only** com
    `estadoNovo = higido`.
  Isso **não** é lacuna de dado: é o modelo sparse (só o que foi
  registrado). A **apresentação** (UI do mapa) pode renderizar face sem
  registro como visualmente hígida (`?? "higido"`) — convenção de
  delivery, **fora** do domínio persistido/projetado.
- RBAC: admin + dentista (igual 003); recepção sem acesso

### Periograma (v2) — spec 005
- id, clinicaId, prontuarioId, profissionalId, tipo (`exame_inicial` |
  `reavaliacao`), registradoEm — **imutável** após salvo (correção =
  novo exame `reavaliacao`)
- `dentes[]` (`DentePeriograma`):
  - `numeroDente`: FDI (mesma validação da 004 — permanente + decídua)
  - `mobilidade`: Miller 0–3 | null
  - `implante`: boolean | null
  - `classificacaoFurca`: VO `{ sistema: "hamp"|"glickman", grau }` | null
    (só molares; Hamp 1–3, Glickman 1–4; uma por dente no MVP)
  - `nota`: texto livre opcional
  - `pontos[]` (`PontoSondagem`, 0..6): lado (`vestibular` |
    `palatina_lingual`) + posição (`mesial`|`central`|`distal`); medições
    opcionais: `margemGengival` (int, pode negativo), `profundidadeSondagem`,
    `placa`, `sangramentoSondagem`
- Métricas agregadas / nível de inserção: **fora** do domínio persistido
  (UI futura)
- RBAC: admin + dentista (igual 003); recepção sem acesso

### ClinicWhatsappAccount
- id, clinicaId, wabaId, phoneNumberId, accessToken (criptografado),
  status (pendente|conectado|desconectado), conectadoEm, tokenExpiraEm

### ConversaBot
- id, clinicaId, telefonePaciente, etapaAtual (enum da máquina de estados),
  contexto (json), status (bot-ativo|aguardando-humano|encerrada), atualizadoEm

### UsuarioPlataforma
- id, nome, email, papel (`super-admin`) — usuário do dono/desenvolvedor da
  Dentyvo, sem vínculo com nenhuma `Clinica`. Não confundir com `Profissional`
  (que é usuário dentro de uma clínica/tenant).

### Assinatura
- id, clinicaId, planoId, status (`trialing`|`ativa`|`inadimplente`|`cancelada`),
  gatewayAssinaturaId (id da assinatura no gateway de pagamento),
  dataInicio, dataProximaCobranca, dataCanceladaEm
- acessoManualAte / acessoManualMotivo (override 010)
- **Promoção de lançamento (012)** — cópia operacional (fonte de verdade =
  `VagaPromocional`):
  - `precoPromocionalCentavos` (nullable)
  - `precoPromocionalAte` (nullable)
  - `avisoAumentoPrecoEnviadoEm` (nullable; camada 1 de idempotência do aviso)
  - `migradaParaPrecoCheioEm` (nullable; idempotência de
    `MigrarPrecoPosPromocao` — se setado, job não chama o gateway de novo)

### VagaPromocional (spec 012)
- Fonte de verdade da reserva do cupom de lançamento (máx. 30)
- `posicao` (1..30, PK + CHECK), `clinicaId` (UNIQUE), `assinaturaId`,
  `reservadaEm`
- Cancelamento **não** libera a posição; campos promocionais na `Assinatura`
  são cópia na criação, sem edição independente

### Plano
- id, nome (ex: "Básico", "Médio", "Full"), valorMensal, limitesDeUso (ex: nº de
  profissionais, nº de mensagens do bot/mês — a definir conforme precificação)
- Elegíveis à promoção 012: Básico (R$ 59) e Médio (R$ 99); Full não consome
  vaga

### Cobranca
- id, assinaturaId, gatewayCobrancaId, valor, metodo (`pix`|`boleto`|`cartao`),
  status (`pendente`|`paga`|`vencida`|`estornada`), vencimento, pagaEm
- **Não confundir** com `CobrancaPaciente` (financeiro clínico — spec 013
  futura). `Cobranca` aqui é cobrança da **assinatura SaaS** da clínica.
- Painel (`ObterDetalhesAssinatura`): até 12 mais recentes por `vencimento`
  desc, lidas do repositório local (não gateway). Read-model em
  `DetalhesAssinatura` — não é entidade persistida.

### CobrancaPaciente *(futuro / spec 013 — não implementado ainda)*
- Nome reservado para a entidade de cobrança por atendimento ao paciente
  (contas a receber). Vocabulário fixado para evitar nome incompatível em
  integrações antes da spec formal. Campos, RBAC e invariantes: ver
  planejamento em `specs/00-overview.md` (seção Financeiro — 013).

### DespesaOperacional *(futuro / spec 013 — não implementado ainda)*
- Nome reservado para despesa operacional da clínica (contas a pagar:
  aluguel, salário, material, equipamento, etc.). Vocabulário fixado para
  evitar nome incompatível antes da spec formal. Ver
  `specs/00-overview.md` (seção Financeiro — 013).

### Notificacao (spec 011)
- id
- destinatário XOR: `destinatarioUsuarioId` **ou**
  `destinatarioUsuarioPlataformaId`
- `tipo` (`aviso_aumento_preco` | `lembrete_consulta` | `trial_acabando` |
  `cobranca_vencida` | `convite_usuario`)
- `chaveNegocio` (nullable) — id opaco do evento de origem; com chave, dedup
  por tipo + destinatário + chave no **balde horário fixo** de 1h
  (`janelaDedup = floor(criadaEm / 1h)`); baldes vizinhos (ex. 12:59 / 13:01)
  não deduplicam — limitação consciente (spec 011), não bug
- `conteudo` — allowlist operacional **sem PHI** (mesmo espírito de
  `DetalheAuditoria`: titulo, mensagem, linkAcao, ids de plano/assinatura/
  cobrança/convite/agendamento, dataReferenciaIso, valorCentavos)
- envios por canal — no domínio, coleção no agregado; na **persistência**,
  tabela normalizada `notificacao_envio` (não JSON na linha de
  `notificacao`): `notificacaoId`, `canal` (`email`|`in_app`), `statusEnvio`
  (`pendente` → `enviada` | `falhou`; terminais no MVP, sem retry)
- `lida` / `lidaEm`, `criadaEm`
- RBAC: só o destinatário lista/marca as próprias (sem inbox cross-tenant)

## Regras de negócio centrais (candidatas a teste de domínio)

- Um usuário (BetterAuth) pertence a exatamente uma clínica no MVP, via um
  único `Profissional`.
- Documento fiscal da `Clinica` (CPF ou CNPJ) é único na plataforma.
- Convite é de uso único e expira em 72 horas.
- Um agendamento não pode sobrepor outro do mesmo profissional na mesma clínica.
- Um paciente só pertence a uma clínica por registro (não há paciente
  compartilhado entre tenants).
- Uma `ClinicWhatsappAccount` só pode estar `conectado` se tiver token válido;
  token expirado força status para `desconectado` e bloqueia envio.
- Uma `ConversaBot` em status `aguardando-humano` não deve receber resposta
  automática do bot até um atendente humano encerrar ou devolver ao bot.
- Anamnese só pode ser preenchida/editada por usuário vinculado à clínica dona
  do prontuário (checagem de tenant obrigatória).
- `Receita` e `Atestado` são imutáveis após emissão; correção = nova emissão.
  Só `dentista` emite/lista/gera PDF. CID do atestado, se presente, valida
  apenas formato CID-10 (não catálogo).
- Uma `Clinica` com `Assinatura` em status diferente de `trialing`/`ativa`
  perde acesso às funcionalidades operacionais (agendamento, prontuário, bot),
  mas mantém acesso de leitura/exportação dos próprios dados (nunca bloquear
  dado clínico de forma irrecuperável por inadimplência).
- `UsuarioPlataforma` (super-admin) nunca é escopado por `clinicaId` — é o único
  papel do sistema com acesso cross-tenant, e todo acesso dele a dado de clínica
  também passa por `AuditoriaLogPort` (ver spec 003), por ser dado sensível.
