# 012 — Promoção de lançamento (assinatura)

## Status
`aprovada`

## Contexto
A intenção de produto já está registrada em
`specs/features/010-assinatura-pagamento.md` (seção **Precificação e promoção
de lançamento**), mas ficou **fora do escopo da 010** até existir spec própria
com critérios de aceite e ciclo SDD completo. Esta feature fecha esse gap.

Os **30 primeiros clientes** da Dentyvo pagam preço promocional em planos
elegíveis (Básico e Médio) por **12 meses corridos** a partir da assinatura
paga; depois migram automaticamente para o preço cheio do plano. Antes dessa
migração, o cliente deve ser avisado — via o módulo central de notificações
(**011**), tipo `aviso_aumento_preco`, canais **e-mail** + **in-app** — e não
cobrado silenciosamente o valor cheio.

A promoção é uma **característica da Assinatura** (módulo `src/core/assinatura`
já existente na 010), não um domínio à parte. Não criar `core/promocao`.

## User story
Como dono de clínica entre os primeiros assinantes, quero pagar o valor
promocional do plano escolhido pelos primeiros 12 meses e ser avisado com
antecedência quando o preço for subir, para planejar o orçamento sem surpresa
na renovação.

Como produto/plataforma, quero limitar a promoção a exatamente 30 primeiras
clínicas elegíveis, de forma segura sob concorrência, para não estourar o
cupom de lançamento em cadastros simultâneos.

## Decisões já travadas pela 010 / 011 (não reabrir)

| # | Fonte | Decisão |
|---|---|---|
| T1 | 010 | Preço promocional: Básico **R$ 59/mês**, Médio **R$ 99/mês** |
| T2 | 010 | Prazo: **12 meses corridos** a partir da assinatura paga / início do
benefício (ver D8) |
| T3 | 010 | Após o prazo: migração **automática** para o preço cheio do plano |
| T4 | 010 + 011 | Aviso pré-migração via `EnviarNotificacao` (011), tipo
`aviso_aumento_preco`, canais **e-mail** + **in-app** — sem canal ad hoc |
| T5 | 010 | Contador de vagas = **invariante protegida por constraint de banco**
(mesmo espírito de EXCLUDE/UNIQUE das features 002 e 011) — não “checar
depois escrever” só em memória |
| T6 | — | Módulo alvo: **estender** `src/core/assinatura` (não criar módulo novo) |
| T7 | 011 | Dedup genérica de notificação: `tipo` + destinatário + `chaveNegocio`
no **balde horário fixo de 1h** — insuficiente sozinha para job que rode
ao longo de dias; produtor usa flag + `chaveNegocio` (ver D7) |

### Faixas de preço cheio (ainda em faixa — 010)

| Plano | Faixa mensal cheia (010) | Preço promocional (12 meses) |
|---|---|---|
| Básico | R$ 79–99/mês | **R$ 59/mês** |
| Médio | R$ 149–179/mês | **R$ 99/mês** |
| Full | R$ 249–299/mês | **sem** preço promocional definido |

> Valor cheio exato de cada plano (dentro da faixa) permanece seed/config da
> 010; esta feature só redefine o valor cobrado enquanto a promoção estiver
> ativa nos planos elegíveis.

## Decisões aprovadas (Planejador)

| # | Tema | Decisão |
|---|---|---|
| D1 | Unidade da vaga | **1 vaga = 1 clínica** (`UNIQUE clinica_id`). Troca de plano na mesma clínica **não** consome outra vaga. |
| D2 | Plano Full | **Não** consome vaga. Só Básico e Médio (planos com preço promocional) são elegíveis. |
| D3 | Concorrência | Constraint de banco + atribuição atômica da posição numa **única** statement SQL (detalhe abaixo). **Proibido** `SELECT MAX` + `INSERT` separados. |
| D4 | Aviso | **Um** aviso, **30 dias corridos** antes de `precoPromocionalAte`. Sem aviso aos 7 dias no MVP. |
| D5 | Cancelar / reativar | Mantém vaga e `precoPromocionalAte` original; cancelamento **não** libera a posição. Ver nota de produto abaixo. |
| D6 | Fonte de verdade | `VagaPromocional` = fonte de verdade da reserva; campos na `Assinatura` são **cópia no momento da criação**, nunca editáveis de forma independente. |
| D7 | Idempotência do aviso | Hierarquia em duas camadas (detalhe abaixo): flag primário + `chaveNegocio` secundário. |
| D8 | Momento da reserva | Em **`CriarAssinatura`** (plano pago elegível). Trial **não** consome vaga. |
| D9 | Preço cheio | Usar `Plano.valorMensal` do seed; promocional = override 59 / 99. |

### D3 — Mecanismo exato de atribuição atômica da posição (aprovado)

**Tabela** `vaga_promocional_lancamento`:

| Coluna | Constraint |
|---|---|
| `posicao` `SMALLINT` | `PRIMARY KEY` + `CHECK (posicao >= 1 AND posicao <= 30)` |
| `clinica_id` `TEXT NOT NULL` | `UNIQUE` |
| `assinatura_id` `TEXT NOT NULL` | — |
| `reservada_em` `TIMESTAMPTZ NOT NULL` | — |

**Proibido:** `SELECT MAX(posicao)` (ou `COUNT(*)`) numa round-trip e `INSERT`
numa segunda — janela de corrida entre as duas operações.

**Escolha aprovada:** uma única statement `INSERT … SELECT` que escolhe e
grava a menor posição livre:

```sql
INSERT INTO vaga_promocional_lancamento
  (posicao, clinica_id, assinatura_id, reservada_em)
SELECT s.posicao, $clinicaId, $assinaturaId, $agora
FROM generate_series(1, 30) AS s(posicao)
WHERE NOT EXISTS (
  SELECT 1
  FROM vaga_promocional_lancamento v
  WHERE v.posicao = s.posicao
)
ORDER BY s.posicao
LIMIT 1
RETURNING *;
```

Comportamento do adapter (`VagaPromocionalRepositoryPort.reservarAtomico`):

1. Executa a statement acima.
2. **0 linhas retornadas** → cupom esgotado →
   `VagasPromocionaisEsgotadasError` (assinatura segue pelo preço cheio, sem
   benefício promocional).
3. **`unique_violation` em `posicao`** (dois txs escolheram a mesma posição
   livre sob `READ COMMITTED`) → **retry** da **mesma** statement (limite
   superior: 30 tentativas). Cada tentativa continua sendo um único
   `INSERT … SELECT` atômico — não reintroduz `SELECT` separado + `INSERT`.
4. **`unique_violation` em `clinica_id`** → clínica já possui vaga →
   idempotente: retorna a vaga existente (não reserva segunda).

A PK + `CHECK` garantem que nunca existam mais de 30 linhas nem `posicao`
fora de 1..30, mesmo sob concorrência. A regra de domínio permanece
testável sem banco; a constraint é a rede de segurança atômica.

> Alternativas consideradas e **não** escolhidas para o MVP: (a) loop
> aplicativo `INSERT posicao=N ON CONFLICT DO NOTHING` posição a posição
> (correto, mas N round-trips); (b) `SEQUENCE` do Postgres (bom para
> contadores ilimitados, menos natural para “buracos” 1..30 com PK fixa).
> A statement única com `generate_series` + retry só em conflito de PK
> combina atomicidade e simplicidade.

### D5 — Nota de produto (aprovada)

Cancelamento **não** devolve a posição ao pool. Conseqüência consciente:

> O slogan “30 primeiros clientes com desconto” refere-se a **30 reservas
> emitidas**, não necessariamente a **30 clínicas simultaneamente** no preço
> promocional. Se houver cancelamentos, o número de beneficiários ativos
> pode ser **menor que 30**. Isso é escolha de **simplicidade para o MVP**
> (sem reciclar vagas, sem fila de espera), **não** limitação acidental.

### D6 — Fonte de verdade vs cópia (aprovada)

| Artefato | Papel |
|---|---|
| `VagaPromocional` | **Fonte de verdade** da reserva (posição, clínica, assinatura de origem, `reservadaEm`) |
| Campos na `Assinatura` (`precoPromocionalCentavos`, `precoPromocionalAte`, …) | **Cópia operacional** gravada **somente no momento da criação/reserva**, para cobrança, gateway e job de aviso sem join obrigatório |

Invariante: esses campos da `Assinatura` **nunca** são editados de forma
independente da vaga (sem “corrigir à mão” só na assinatura). Qualquer
mudança futura de benefício (fora do MVP) passaria por caso de uso que
respeite a vaga como origem — evitando divergência entre os dois.

`avisoAumentoPrecoEnviadoEm` vive só na `Assinatura` (estado do ciclo de
aviso, não da reserva).

### D7 — Hierarquia de idempotência do aviso (aprovada)

Dois mecanismos, papéis explícitos:

| Camada | Mecanismo | Papel |
|---|---|---|
| **1 — primária** | `Assinatura.avisoAumentoPrecoEnviadoEm` | Consultada **antes** de sequer chamar `EnviarNotificacao`. Se `!= null` → no-op (cobre reexecução do job ao longo de dias/semanas). |
| **2 — secundária** | `chaveNegocio` na 011 | Defesa contra **corrida** se duas instâncias do job rodarem ao mesmo tempo e ambas passarem da camada 1 antes de gravar o flag. |

Formato obrigatório da chave:

```
aviso_aumento_preco:{assinaturaId}:{precoPromocionalAte:yyyy-MM-dd}
```

Fluxo do caso de uso `EnviarAvisoAumentoPreco`:

1. Carregar assinatura; se sem promoção ativa / fora da janela de 30 dias →
   no-op.
2. **Camada 1:** se `avisoAumentoPrecoEnviadoEm != null` → return (não chama
   011).
3. Chamar `EnviarNotificacao` com tipo `aviso_aumento_preco`, canais
   `["email", "in_app"]`, `chaveNegocio` acima, `conteudo` sem PHI.
4. **Camada 2:** a 011 deduplica no balde de 1h se duas chamadas simultâneas
   colidirem.
5. Após envio persistido com sucesso → gravar
   `avisoAumentoPrecoEnviadoEm = agora`.

Canais e tipo não criam canal ad hoc — só consumo da 011.

### D8 / D9 (aprovados, resumo)

- **D8:** reserva em `CriarAssinatura`; `precoPromocionalAte = agora + 12
  meses` (início do benefício = criação da assinatura paga, não o trial).
  Sem vaga → assinatura pelo preço cheio, sem campos promocionais.
- **D9:** preço cheio = `Plano.valorMensal`; promocional = 5900 / 9900
  centavos.

## Critérios de aceite

- [ ] Extensão do módulo `src/core/assinatura` (domain / application / ports);
      **sem** novo `src/core/promocao`.
- [ ] Constantes de domínio: limite **30** vagas; preços promocionais Básico
      **5900** centavos e Médio **9900** centavos; duração **12** meses
      corridos; antecedência do aviso **30** dias.
- [ ] Ao `CriarAssinatura` com plano elegível (Básico/Médio) e vagas
      disponíveis: reserva atômica de `VagaPromocional` via `INSERT …
      SELECT … LIMIT 1` (D3) e **copia** para a assinatura
      `precoPromocionalCentavos` + `precoPromocionalAte` (D6).
- [ ] Com vagas esgotadas: assinatura criada pelo preço cheio do plano,
      **sem** campos promocionais.
- [ ] Plano Full (ou plano sem preço promocional): **não** consome vaga.
- [ ] Uma clínica não obtém mais de uma vaga (`UNIQUE clinica_id`).
- [ ] Constraint de banco impede `posicao` fora de 1..30 e impede 31ª vaga
      sob concorrência; **não** há caminho de produção com `SELECT MAX` +
      `INSERT` separados (teste de integração / revisão de adapter).
- [ ] Campos promocionais na `Assinatura` não são editáveis de forma
      independente da `VagaPromocional` (fonte de verdade da reserva).
- [ ] Enquanto `agora < precoPromocionalAte` e campos promocionais
      preenchidos, cobranças/gateway usam o valor promocional; ao atingir /
      passar a data, passam a usar `Plano.valorMensal` (migração automática
      de preço).
- [ ] Job/caso de uso de aviso: para assinaturas com promoção a ≤ 30 dias do
      fim e sem `avisoAumentoPrecoEnviadoEm`, chama `EnviarNotificacao` com
      tipo `aviso_aumento_preco`, canais e-mail + in-app, e
      `chaveNegocio = aviso_aumento_preco:{assinaturaId}:{precoPromocionalAte:yyyy-MM-dd}`.
- [ ] Hierarquia D7 respeitada: flag consultado **antes** de chamar 011;
      `chaveNegocio` como segunda camada sob corrida.
- [ ] `MigrarPrecoPosPromocao` é idempotente: se
      `migradaParaPrecoCheioEm != null`, não chama
      `atualizarValorAssinatura` de novo (job reentrante / paralelo).
- [ ] Reexecução do job após aviso já enviado é no-op.
- [ ] `CriarAssinatura` cobre E1 (elegível+vaga), E2 (elegível+esgotado →
      preço cheio sem erro) e E3 (Full nunca reserva).
- [ ] Cancelamento + reativação dentro da janela: mantém vaga e
      `precoPromocionalAte` original; cancelamento não libera posição (D5).
- [ ] Conteúdo do aviso sem PHI (contrato `ConteudoNotificacao` da 011).
- [ ] Não redefine `Notificacao` / `ConteudoNotificacao` — importa de
      `src/core/notificacao/domain` e consome `EnviarNotificacao` da 011.
- [ ] Leitura do painel (`ObterDetalhesAssinatura`) inclui
      `precoPromocionalAte?`, `migradaParaPrecoCheioEm?` e
      `vagaPromocional?: { posicao }` sem mutar reserva, cópia promocional,
      aviso ou migração. Ver seção *Emenda — ObterDetalhesAssinatura
      (extensão 012)* (`aprovada`).

## Regras de negócio
- No máximo **30** vagas promocionais de lançamento na plataforma (invariante
  global, reforçada por constraint).
- Elegibilidade promocional: apenas planos com preço promocional definido
  (Básico, Médio).
- Uma clínica consome no máximo uma vaga; posição consumida **não** volta ao
  pool no cancelamento (D5 + nota de produto).
- `VagaPromocional` é a fonte de verdade da reserva; campos promocionais na
  `Assinatura` são cópia na criação, sem edição independente (D6).
- Preço promocional vale por **12 meses corridos** a partir do início do
  benefício (D8); depois, preço cheio obrigatório.
- É proibido cobrar o preço cheio na primeira renovação pós-promoção
  **sem** ter disparado o aviso prévio (30 dias antes).
- Aviso de aumento: camada 1 = `avisoAumentoPrecoEnviadoEm`; camada 2 =
  `chaveNegocio` na 011 (D7). Sem canal de e-mail ad hoc.
- Contagem/reserva de vaga **não** pode depender de checagem em memória nem
  de `SELECT` + `INSERT` em duas operações separadas (D3).
- `ObterDetalhesAssinatura` **não** reserva vaga, não edita a cópia
  promocional (D6) e não dispara aviso/migração.

## Modelo de domínio envolvido
Estende entidades já em `specs/02-domain-model.md` / módulo 010; o Arquiteto
atualiza o modelo na etapa seguinte (após sua revisão desta versão
aprovada).

### Assinatura (campos novos — cópia operacional, D6)
- `precoPromocionalCentavos: number | null`
- `precoPromocionalAte: Date | null`
- `avisoAumentoPrecoEnviadoEm: Date | null`
- `migradaParaPrecoCheioEm: Date | null` — idempotência de
  `MigrarPrecoPosPromocao` (mesmo espírito D7: checado **antes** de chamar
  `atualizarValorAssinatura`; gravado após sucesso no gateway)

### VagaPromocional (nova — fonte de verdade da reserva, D3/D6)
- `posicao` (1..30)
- `clinicaId`
- `assinaturaId`
- `reservadaEm`

### Plano
- Reuso; identificar elegibilidade (Básico/Médio) por id/nome/código estável
  definido no seed — detalhe fino do Arquiteto.

### Notificacao (011 — só consumo)
- Importar tipos; **não** redefinir. Usar `EnviarNotificacao` + `chaveNegocio`
  conforme D7.

## Casos de uso (application layer)
*(assinaturas de alto nível; corpo = stub `CasoDeUsoNaoImplementadoError` na
etapa do Arquiteto)*

- `ReservarVagaPromocional({ clinicaId, assinaturaId, planoId, agora }) → VagaPromocional | null`
  (null / erro esgotado conforme desenho do Arquiteto; chamado a partir de
  `CriarAssinatura` ou orquestração próxima)
- `AplicarPrecoPromocionalNaAssinatura({ assinaturaId, vaga, agora }) → Assinatura`
  (copia da vaga para campos da assinatura na criação — D6; ou fundir com a
  reserva num único caso de uso — Arquiteto decide granularidade SOLID)
- `ResolverValorCobrancaAssinatura({ assinaturaId, agora }) → { valorCentavos, origem: "promocional" | "cheio" }`
- `MigrarPrecoPosPromocao({ assinaturaId, agora }) → Assinatura | noop`
  (quando `agora >= precoPromocionalAte`; idempotente via
  `migradaParaPrecoCheioEm` — não chama gateway se já migrada)
- `EnviarAvisoAumentoPreco({ assinaturaId, agora }) → void | Notificacao`
  (consome `EnviarNotificacao` da 011; hierarquia D7)
- `ProcessarAvisosAumentoPrecoPendentes({ agora, limite? }) → { processados: number }`
  (job em lote: lista candidatas e chama `EnviarAvisoAumentoPreco`)
- `ObterDetalhesAssinatura(clinicaId) → DetalhesAssinatura`
  — **somente leitura**; caso de uso-base na emenda da **010** (`aprovada`).
  Esta 012 acrescenta `precoPromocionalAte`, `migradaParaPrecoCheioEm` e
  `vagaPromocional?: { posicao }`. **Não** toca mutação de status, reserva
  de vaga, aviso nem migração de preço. Ver seção
  *Emenda — ObterDetalhesAssinatura (extensão 012)*.

Extensões possíveis em casos de uso **já existentes** da 010 (sem quebrar
contrato público desnecessariamente):
- `CriarAssinatura` — passa a tentar reserva promocional quando elegível.

### Cenários obrigatórios de teste — `CriarAssinatura` + promoção (012)

O Engenheiro de Testes **deve** cobrir os três:

| # | Cenário | Resultado esperado |
|---|---|---|
| E1 | Plano elegível (Básico/Médio) **com** vaga disponível | Reserva `VagaPromocional` + copia preço promocional na assinatura; cobrança/gateway no valor promocional |
| E2 | Plano elegível **sem** vaga (cupom esgotado) | Cria assinatura **normal** em preço cheio; **sem** erro para o admin; campos promocionais null |
| E3 | Plano **Full** (não elegível) | **Nunca** tenta `reservarAtomico`, mesmo com vaga livre; preço cheio |

## Ports necessárias
- `VagaPromocionalRepositoryPort` — `reservarAtomico(input)` implementa a
  statement `INSERT … SELECT` (D3) e traduz unique/check em erros de
  domínio; também `buscarPorClinica(clinicaId)`, `contarReservadas()`
- Extensão de `AssinaturaRepositoryPort` — ler/gravar cópia promocional na
  criação; `listarComAvisoAumentoPrecoPendente({ ate, agora })` para o job;
  gravar `avisoAumentoPrecoEnviadoEm` após aviso
- Reuso: `AssinaturaGatewayPort` — atualizar valor da assinatura recorrente
  no gateway na migração pós-promoção (se o provedor exigir)
- Reuso **obrigatório**: `EnviarNotificacao` da 011 (`id`, `destinatario`,
  `tipo`, `conteudo`, `canais`, `chaveNegocio?`, atores, `clinicaId?`,
  `agora?`)
- Reuso opcional: `AuditoriaLogPort` (003) para falha de aviso / migração —
  decisão fina do Arquiteto

Schema Drizzle esperado (orientação): estender `db/schema/assinatura.ts`
(campos novos + tabela `vaga_promocional_lancamento`), não criar schema de
módulo paralelo.

## Contrato de API / Server Action (se aplicável)
- Fluxo principal é interno: `CriarAssinatura` (já exposto) passa a aplicar
  promoção transparentemente quando elegível.
- Job `ProcessarAvisosAumentoPrecoPendentes`: rota protegida / cron interno
  (não UI pública); autenticação de worker via segredo de cron (padrão a
  alinhar com outros jobs do projeto).
- Leitura no painel da clínica (status “você está no preço promocional até
  dd/mm/aaaa” vs. “encerrada, já no preço cheio”) — via
  `ObterDetalhesAssinatura` (emenda 010 + extensão nesta spec;
  **aprovada**). Não criar server action paralela só de promoção.
- Super-admin (009): visualizar se clínica tem vaga/promoção — nice-to-have;
  não bloqueia o núcleo.

## Fora de escopo
- Criar módulo `core/promocao` separado.
- Redefinir ou alterar o contrato de `Notificacao` / `ConteudoNotificacao` /
  dedup genérica da 011 (exceto consumir).
- Segundo aviso (ex.: 7 dias).
- Promoção para plano Full.
- Reciclar vagas liberadas por cancelamento (ver nota D5).
- Cupons percentuais genéricos, códigos promocionais digitáveis, indicação
  (referral), black Friday, etc.
- Proration / troca de plano no meio do ciclo (já fora do MVP na 010).
- Alterar duração do trial (14 dias) ou regras de inadimplência da 010.
- UI de marketing / landing de “restam N vagas” (débito futuro; contador
  interno basta no MVP).
- Migrar `EmailPort` (001) ou outros produtores legados.
- Mutação qualquer via `ObterDetalhesAssinatura` (emenda de leitura).

## Plano de testes
- **Domínio:** elegibilidade de plano; cálculo de `precoPromocionalAte`
  (+12 meses); `ResolverValorCobranca` promocional vs cheio; regras de
  cancelamento/reativação (D5); formatação de `chaveNegocio`; invariante
  posição 1..30; hierarquia D7 (flag antes de notificar).
- **Aplicação (use case):** reserva com vagas disponíveis; esgotamento;
  idempotência por `clinicaId`; `EnviarAvisoAumentoPreco` no-op se flag
  setado (sem chamar 011); job em lote não duplica; `CriarAssinatura`
  aplica ou não promoção; `ObterDetalhesAssinatura` devolve campos
  promocionais (incl. `migradaParaPrecoCheioEm`) sem chamar
  reserva/migração/aviso.
- **Integração (adapter):** dois `reservarAtomico` paralelos não criam 31ª
  vaga; `SELECT MAX`+`INSERT` separado **não** existe no adapter; segunda
  vaga da mesma clínica é rejeitada/idempotente.
- **Contrato/e2e (crítico):** clínica elegível paga valor promocional;
  após `precoPromocionalAte` valor cheio; aviso dispara uma vez com canais
  e-mail + in-app.

## Dependências

| Spec | Status esperado | Papel |
|---|---|---|
| **010 — Assinatura e pagamento** | já implementada | Módulo base (`Assinatura`, `Plano`, `CriarAssinatura`, gateway) |
| **011 — Notificações** | já implementada | `EnviarNotificacao`, tipo `aviso_aumento_preco`, canais e-mail + in-app, `chaveNegocio` / dedup |
| 001 — Auth multi-tenant | já existe | `clinicaId`, destinatário usuário de clínica |
| 003 — Prontuário / auditoria | já existe | `AuditoriaLogPort` opcional |
| 009 — Admin plataforma | já existe | visualização cross-tenant (opcional nesta feature) |

## Emenda — ObterDetalhesAssinatura (extensão 012)

### Status da emenda
`aprovada` — **pronta para o Arquiteto de Domínio** (junto com a emenda
homônima da **010**). Esta seção **não** duplica o caso de uso: só define
o que a 012 acrescenta no retorno.

A 012 já previa leitura no painel (“você está no preço promocional até
dd/mm/aaaa”) como payload de status — agora isso tem nome:
`ObterDetalhesAssinatura`.

### O que esta spec acrescenta no retorno
Além do núcleo 010 (`plano`, `status`, `dataProximaCobranca`, histórico):

| Campo | Quando preencher | Quando null |
|---|---|---|
| `precoPromocionalAte` | Cópia operacional na `Assinatura` preenchida (D6) | Sem promoção (Full, cupom esgotado, trial) |
| `migradaParaPrecoCheioEm` | Campo já persistido na `Assinatura` após `MigrarPrecoPosPromocao` (P10) | Ainda não migrada / nunca teve promoção |
| `vagaPromocional.posicao` | Existe `VagaPromocional` para a clínica (`buscarPorClinica`) | Sem vaga |

### Critérios de aceite (extensão)
- [ ] Com vaga (cenário E1): retorno inclui `precoPromocionalAte` e
      `vagaPromocional: { posicao }` (1..30) **iguais** à fonte de verdade
      (`VagaPromocional` + cópia na assinatura). Não “corrigir” a cópia
      neste GET (D6).
- [ ] Sem vaga (E2 esgotado / E3 Full / trial): `precoPromocionalAte`
      null, `migradaParaPrecoCheioEm` null e `vagaPromocional` null.
- [ ] **P10:** o DTO inclui `migradaParaPrecoCheioEm: Date | null`
      (campo já existente na entidade `Assinatura`). A UI usa o par
      `precoPromocionalAte` + `migradaParaPrecoCheioEm` para distinguir
      “promoção ainda ativa até X” de “promoção encerrada em X, já
      migrada para preço cheio”. GET **não** apaga nem altera esses
      campos. Devolver os valores persistidos mesmo após a migração
      (`precoPromocionalAte` no passado + `migradaParaPrecoCheioEm`
      preenchido). `vagaPromocional.posicao` se a vaga continuar
      reservada (D5: cancelar / fim dos 12 meses **não** libera posição).
- [ ] **Somente leitura:** não chama `reservarAtomico`,
      `AplicarPrecoPromocionalNaAssinatura`, `MigrarPrecoPosPromocao`,
      `EnviarAvisoAumentoPreco` nem `atualizarValorAssinatura`.
- [ ] RBAC igual à 010 desta emenda: **admin** apenas.
- [ ] Posição **não** é secretada: o admin da clínica que possui a vaga
      pode ver o número (1..30). Não expor contador global “restam N
      vagas” (já fora de escopo desta 012).
- [ ] **P11:** assinatura `cancelada` com vaga: se `buscarPorClinica`
      achar vaga, devolver `posicao`; `status` permanece `cancelada`.
      Leitura não reativa nada.

### Ports (só leitura, já existentes)
- `VagaPromocionalRepositoryPort.buscarPorClinica(clinicaId)`
- Campos promocionais já na `Assinatura` carregada pela 010
  (`precoPromocionalAte`, `migradaParaPrecoCheioEm`)
- `ResolverValorCobrancaAssinatura` (P8 da 010 — `origemValor` /
  `valorEfetivoCentavos`) — continua sendo leitura

### Fora de escopo desta emenda
- Reciclar vagas, promoção Full, segundo aviso, landing “restam N”.
- Qualquer escrita na vaga ou na cópia promocional.

### Decisões aprovadas (emenda)

| # | Tema | Decisão |
|---|---|---|
| P10 | Pós-migração / DTO | Incluir `migradaParaPrecoCheioEm: Date \| null` no DTO (campo já na `Assinatura`). Devolver `precoPromocionalAte` se persistido **e** `migradaParaPrecoCheioEm` para a UI não tratar data passada como promoção ainda vigente. Posição da vaga se ainda reservada (D5). GET não apaga campos. |
| P11 | Cancelada com vaga (D5) | Se `buscarPorClinica` achar vaga, devolver `posicao`; `status` continua `cancelada`. Leitura não reativa. |

P3–P9: spec **010**.

Spec **012** (núcleo + esta emenda) `aprovada` — **pronta para o Arquiteto
de Domínio**.
