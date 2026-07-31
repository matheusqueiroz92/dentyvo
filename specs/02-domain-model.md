# Modelo de Domínio

Entidades centrais e suas relações. Nomes de tabelas/entidades devem seguir esses
termos (português), conforme `.cursor/rules/code-standards.mdc`.

## Entidades principais

### Clinica (tenant)
- id, nome, endereço, documento fiscal (`tipoDocumento`: `cpf`|`cnpj` + valor
  normalizado; exatamente um dos dois — autônomos podem usar CPF), plano de
  assinatura (spec 010), status (`ativa`|`inativa`; cadastro inicia como `ativa`)

### Profissional
- id, clinicaId, nome, papel (`admin`|`dentista`|`recepcao`), cro (obrigatório
  se `dentista`), especialidade (opcional), usuarioId (auth BetterAuth)

### Convite
- id, clinicaId, email, papel (`admin`|`dentista`|`recepcao`), token, expiresAt
  (TTL 72h), aceitoEm (nullable), convidadoPorUsuarioId
  — uso único; ver feature 001

### Paciente
- id, clinicaId, nome, cpf, telefone (WhatsApp), dataNascimento, contatoEmergencia

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
  snapshot de cabeçalho persistido na emissão (obrigatórios: clinicaNome,
  clinicaEndereco, profissionalNome, profissionalCro, pacienteNome,
  pacienteCpf; opcionais: pacienteDataNascimento, profissionalEspecialidade;
  documento fiscal da clínica fora do MVP — ver feature 006),
  assinaturaDigitalId (nullable — v2; assinatura digital fora do MVP)

### Odontograma (v2 — spec 004)
- Fonte de verdade: eventos append-only `EventoOdontograma` (sem snapshot
  completo). Estado vigente = projeção do evento mais recente por
  `numeroDente`+`face` (nível face) ou por `numeroDente` (nível dente).
- Ordenação determinística: `registradoEm` asc, depois `sequencia` asc
  (bigserial no banco — desempate monotônico; **não** usar `id` UUID).
- `EventoOdontograma`: id, clinicaId, prontuarioId, numeroDente, nivel
  (`face`|`dente`), face? (obrigatória se nível face), estadoNovo,
  procedimentoId?, registradoEm, profissionalId, sequencia (null só antes
  de persistir; preenchida pelo adapter no insert)
- `salvarEventos`: **atômico (tudo-ou-nada)** — transação explícita no
  adapter; falha em qualquer item ⇒ nenhum evento do lote persiste
- `numeroDente`: FDI — permanentes `{11–18,21–28,31–38,41–48}` + decíduos
  `{51–55,61–65,71–75,81–85}`; fora disso → `NumeroDenteInvalidoError`
- Faces: vestibular, lingual_palatina, mesial, distal, oclusal
- `EstadoOdontograma` (enum extensível): higido, cariado, restaurado,
  ausente_extraido, indicado_extracao, protese_coroa, implante, fraturado,
  tratamento_endodontico, selante
- `ausente_extraido`: estado no **nível do dente**; dente ausente não tem
  faces vigentes (eventos de face rejeitados enquanto ausente — valida
  contra vigente reconstruído do histórico persistido, não só o lote)
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
- Uma `Clinica` com `Assinatura` em status diferente de `trialing`/`ativa`
  perde acesso às funcionalidades operacionais (agendamento, prontuário, bot),
  mas mantém acesso de leitura/exportação dos próprios dados (nunca bloquear
  dado clínico de forma irrecuperável por inadimplência).
- `UsuarioPlataforma` (super-admin) nunca é escopado por `clinicaId` — é o único
  papel do sistema com acesso cross-tenant, e todo acesso dele a dado de clínica
  também passa por `AuditoriaLogPort` (ver spec 003), por ser dado sensível.
