# 001 — Autenticação Multi-Tenant

## Status
`aprovada`

## Contexto
A plataforma atende múltiplas clínicas (tenants). É preciso autenticar usuários,
vincular cada um a exatamente uma clínica e garantir isolamento total de dados
entre clínicas diferentes, com papéis distintos (`admin`, `dentista`, `recepcao`).

### Baseline do scaffold (já existe — não recriar)
- BetterAuth configurado em `src/lib/auth.ts` (email/password) + rota
  `src/app/api/auth/[...all]`.
- Tabelas core do BetterAuth em `src/db/schema/auth.ts`
  (`user`, `session`, `account`, `verification`) — sem `clinicaId`/papel ainda.
- Cliente em `src/lib/auth-client.ts`.

Esta feature **estende** esse baseline (tenant + RBAC + convites + cadastro de
clínica). Não substitui o BetterAuth por outra lib de auth.

## User story
Como dono de clínica, quero criar uma conta para minha clínica e convidar minha
equipe, para que cada pessoa acesse só os dados da minha clínica com o nível de
permissão adequado.

## Critérios de aceite
- [ ] Cadastro público cria, atomicamente: `Clinica` (tenant) + usuário BetterAuth
      + vínculo `Profissional` com papel `admin`.
- [ ] Cadastro da clínica exige `nome`, `endereço` e documento fiscal
      (`CPF` **ou** `CNPJ`, um dos dois, único na plataforma); status inicial
      `ativa`.
- [ ] Login e logout usam BetterAuth (email/senha); sessão autenticada expõe
      `usuarioId`, `clinicaId` e `papel` para a application layer.
- [ ] Admin da clínica pode convidar usuários por e-mail com papel `admin`,
      `dentista` ou `recepcao`.
- [ ] Aceitar convite válido (token não usado e não expirado; TTL **72 horas**)
      cria o usuário BetterAuth (se ainda não existir) e o vínculo
      `Profissional` na clínica do convite; convite inválido/expirado falha de
      forma explícita.
- [ ] Um e-mail não pode ficar vinculado a duas clínicas (regra MVP: um usuário =
      uma clínica).
- [ ] Toda leitura/escrita dos repositórios desta feature (`Clinica`,
      `Profissional`, `Convite`) é escopada por `clinicaId` da sessão — tentativa
      de acessar outro tenant falha (erro de autorização / resultado vazio,
      nunca vazamento). O padrão (escopo por tenant em todo repository) vale
      como regra de arquitetura para as features 002+; não exige entidades
      paciente/prontuário nesta feature.
- [ ] Existe matriz de permissões mínima (abaixo) aplicada via checagem de
      `papel` na application layer (não só na UI).
- [ ] Sessão expira automaticamente (TTL **7 dias**, renovável pelo BetterAuth)
      e o usuário pode revogar a própria sessão (logout). Admin pode encerrar
      sessões de um membro da própria clínica.
- [ ] Admin atualiza nome e/ou endereço da própria clínica
      (`AtualizarClinica`); documento fiscal (CPF/CNPJ) permanece imutável.
      Ver seção *Emenda — AtualizarClinica* (`aprovada`).

### Matriz de permissões (MVP desta feature)

| Ação | admin | dentista | recepcao |
|---|---|---|---|
| Convidar usuário (incl. outro admin) | sim | não | não |
| Aceitar próprio convite | sim* | sim* | sim* |
| Ver membros da clínica | sim | sim | sim |
| Alterar papel / remover membro | sim | não | não |
| Revogar sessões de outro membro | sim | não | não |
| Editar dados cadastrais da clínica | sim | não | não |

\* papéis atribuídos no convite; o aceitante ainda não tem sessão na clínica
até concluir o aceite.

> **Nota para features futuras:** a restrição “só `admin`/`dentista` acessam
> prontuário completo” **não é enforceada aqui** (módulo ainda inexistente).
> Fica registrada como política a ser aplicada na spec 003; esta feature só
> entrega `papel` na sessão + utilitário/port de autorização reutilizável.

## Regras de negócio
- Um usuário pertence a exatamente uma clínica no MVP (sem multi-clínica).
- Todo dado de domínio desta feature é particionado por `clinicaId`.
- Papéis válidos de clínica: `admin` | `dentista` | `recepcao`.
- `UsuarioPlataforma` / `super-admin` **não** faz parte desta feature (spec 009).
- Convite é de uso único; após aceite ou expiração, não pode ser reutilizado.
- Convite expira em **72 horas**.
- Sessão autentica expira em **7 dias** (renovável conforme BetterAuth).
- Convite para e-mail já pertencente a outra clínica deve falhar.
- Recepção e dentista (e admin) são modelados como `Profissional` vinculados a
  um `usuarioId` BetterAuth; CRO/especialidade são obrigatórios só para
  `dentista` (recepção/admin podem omitir).
- Cadastro de clínica pelo fluxo público **não** cria `UsuarioPlataforma`.
- Documento fiscal da clínica: exatamente um entre `CPF` ou `CNPJ` (muitos
  consultórios do público-alvo inicial são autônomos sem CNPJ); o valor deve
  ser único na plataforma.
- **Documento fiscal é imutável após o cadastro** (emenda `AtualizarClinica`):
  mesma justificativa de `AtualizarPaciente` (002, decisão 13) — campo de
  identidade/deduplicação; alteração livre arrisca mesclar o tenant errado.
  Correção de documento errado = fluxo separado, fora desta emenda.
- Verificação de e-mail **não é obrigatória no MVP** (o link do convite basta
  como prova fraca de posse do endereço). **Revisar antes do lançamento
  comercial** (impacto LGPD / abuso de cadastro).

## Modelo de domínio envolvido
- `Clinica` (tenant) — criada no cadastro com `nome`, `endereço`, documento
  (`tipoDocumento`: `cpf`|`cnpj` + valor), `status` inicial `ativa`.
  (Alinhar `specs/02-domain-model.md`, que hoje cita só `cnpj`.)
- `Profissional` — vínculo usuário ↔ clínica ↔ papel (e dados profissionais).
- `Convite` — entidade desta feature (ainda não listada em
  `specs/02-domain-model.md`; Arquiteto deve alinhar/atualizar o model ao
  implementar): token, email, papel, clinicaId, expiresAt, aceitoEm?,
  convidadoPorUsuarioId.
- Usuário de autenticação = tabela BetterAuth `user` (não renomear para outro
  store de credenciais).

## Casos de uso (application layer)
- `CriarClinicaComAdmin(dadosClinica, dadosAdmin) → Clinica`
- `ConvidarUsuario(clinicaId, email, papel, convidadoPorUsuarioId) → Convite`
- `AceitarConvite(tokenConvite, dadosAceite) → Profissional`
- `ListarMembrosDaClinica(clinicaId) → Profissional[]`
- `AlterarPapelMembro(clinicaId, profissionalId, novoPapel, solicitadoPorUsuarioId) → Profissional`
- `RemoverMembro(clinicaId, profissionalId, solicitadoPorUsuarioId) → void`
- `RevogarSessoesDoMembro(clinicaId, profissionalId, solicitadoPorUsuarioId) → void`
- `ObterContextoSessao() → { usuarioId, clinicaId, papel } | null`
- `AtualizarClinica(clinicaId, nome?, endereco?) → Clinica`
  — emenda **aprovada** (ver seção *Emenda — AtualizarClinica*). Documento
  fiscal **não** entra no input. Pelo menos um de `nome`/`endereco` é
  obrigatório (P1).

Login/logout em si ficam no BetterAuth (handlers já existentes); a application
consome a sessão via port (abaixo), sem reimplementar autenticação.

## Ports necessárias
- `ClinicaRepositoryPort`
- `ProfissionalRepositoryPort`
- `ConviteRepositoryPort`
- `AuthPort` (criar usuário BetterAuth, autenticar contexto de sessão, revogar
  sessão(ões) — adapta o BetterAuth; domain/application não importam a lib)
- `EmailPort` (enviar e-mail de convite; em testes: fake/in-memory)
- `AutorizacaoPort` ou helper de domínio equivalente
  (`assertPapel(papel, acao)` / `pode(papel, acao)`)

## Contrato de API / Server Action (se aplicável)

| Fluxo | Camada | Entrada (alto nível) | Saída |
|---|---|---|---|
| Cadastro clínica + admin | Server Action | nome, endereço, documento (`cpf`\|`cnpj` + valor) + nome/email/senha do admin | Clínica criada (`status: ativa`) + sessão iniciada (ou redirect pós-login) |
| Login / logout | BetterAuth (`/api/auth/*`) | email/senha | cookie de sessão / limpeza |
| Convidar usuário | Server Action (autenticada, `admin`) | email, papel (`admin`\|`dentista`\|`recepcao`) | Convite criado (72h) + e-mail disparado |
| Aceitar convite | Server Action / rota pública com token | token, nome, senha (+ CRO se dentista) | Profissional + sessão |
| Listar membros | Server Action (autenticada) | — (usa `clinicaId` da sessão) | lista de membros |
| Alterar papel / remover | Server Action (autenticada, `admin`) | profissionalId, novoPapel? | ok / erro de domínio |
| Revogar sessões | Server Action (autenticada, `admin` ou self-logout) | profissionalId? | ok |
| Atualizar clínica (nome/endereço) | Server Action (autenticada, `admin`) | `nome?`, `endereco?` (pelo menos um; não inclui documento) | `Clinica` atualizada |

Rotas de UI mínimas esperadas (delivery, sem regra de negócio):
- `/cadastro` (clínica + admin)
- `/login`
- `/convite/[token]` (aceite)
- área autenticada mínima para admin convidar/listar membros (pode ser página
  simples sob `(dashboard)` — UI rica de “equipe” pode evoluir depois)

## Fora de escopo
- Multi-clínica por usuário.
- SSO / login social.
- `UsuarioPlataforma` / painel super-admin (spec 009).
- Enforce de permissões de prontuário/agendamento/receituário (specs 002/003/006)
  — apenas entrega do `papel` na sessão e da matriz base.
- Verificação obrigatória de e-mail no MVP (ver nota em Decisões aprovadas —
  revisar antes do lançamento comercial).
- Escolha do provedor de e-mail em produção (a port existe; adapter real pode
  ser stub/console no MVP desta feature).
- Assinatura/trial no cadastro (spec 010) — cadastro cria clínica; trial pode
  ser enganchado depois.

## Plano de testes
- **Domínio:** usuário/profissional não pode pertencer a duas clínicas; papéis
  inválidos rejeitados; convite expirado/reutilizado falha; matriz
  `pode(papel, acao)`; documento da clínica aceita CPF ou CNPJ (não ambos
  vazios; unicidade do valor).
- **Aplicação:** `CriarClinicaComAdmin` cria tenant + admin com status `ativa`;
  `ConvidarUsuario` gera token com expiração de 72h (incl. convite de outro
  admin); `AceitarConvite` feliz / token inválido; operações admin vs recepção
  respeitam matriz; isolamento por `clinicaId` nos use cases desta feature;
  `AtualizarClinica`: admin altera nome/endereço (pelo menos um); ambos
  omitidos falham; dentista/recepção recebem permissão negada; contrato de
  input sem documento.
- **Integração (adapters):** repositório com `clinicaId` da sessão diferente do
  recurso alvo não retorna/altera dado de outro tenant; `EmailPort` fake
  recebe o convite; `AuthPort` integra com BetterAuth (criar usuário / ler
  sessão / revogar) sem vazar detalhe da lib para o domínio.
- **Contrato (crítico):** cadastro → login → convite → aceite → membro aparece
  na clínica correta; segundo cadastro com mesmo e-mail falha.

## Dependências
- Scaffold (BetterAuth + Drizzle + estrutura hexagonal) — **já cumprida**.
- Nenhuma outra feature de negócio.

## Decisões aprovadas

1. **Admin pode convidar outro `admin`:** sim; apenas `admin` convida.
2. **TTL:** sessão **7 dias** (renovável pelo BetterAuth); convite **72 horas**.
3. **Verificação de e-mail:** **não obrigatória no MVP**.  
   **Nota:** revisar antes do lançamento comercial (LGPD / abuso de cadastro).
4. **Isolamento nesta feature:** aceite testável em `Clinica` / `Profissional` /
   `Convite` + sessão com `clinicaId`; padrão de escopo por tenant obrigatório
   nas features 002+ (sem exigir paciente/prontuário aqui).
5. **Campos mínimos do cadastro de clínica:** `nome` (obrigatório), `endereço`
   (obrigatório), documento fiscal **CPF ou CNPJ** (exatamente um, valor único
   na plataforma — autônomos sem CNPJ são público-alvo inicial). Status inicial:
   `ativa` (assinatura/trial na 010).
6. **`AtualizarClinica` (emenda):** ver seção abaixo — **aprovada**.

## Emenda — AtualizarClinica

### Status da emenda
`aprovada` — **pronta para o Arquiteto de Domínio**.

Fecha o gap da matriz já aprovada (“Editar dados cadastrais da clínica” =
`admin` apenas) que ainda não tinha caso de uso intra-tenant. Não confundir
com `EditarClinica` da spec **009** (ator `UsuarioPlataforma` / super-admin,
cross-tenant). Logo, tema e slug já têm casos de uso próprios
(`AtualizarLogoClinica`, `AtualizarTemaClinica`, `AtualizarSlugClinica`) —
**fora** deste caso de uso.

### User story
Como admin da clínica, quero atualizar o nome e/ou o endereço cadastrais
da minha clínica, para corrigir dados operacionais sem poder alterar o
documento fiscal (identidade do tenant).

### Critérios de aceite
- [ ] Caso de uso `AtualizarClinica(clinicaId, nome?, endereco?) → Clinica`
      no módulo `src/core/auth` (não em admin-plataforma).
- [ ] RBAC: **somente `admin`**. `dentista` e `recepcao` recebem permissão
      negada (mesma matriz já listada: “Editar dados cadastrais da clínica”).
- [ ] Escopo por `clinicaId` da sessão: admin não atualiza outra clínica.
      Clínica inexistente / outro tenant → erro de domínio (não vazamento).
- [ ] Campos editáveis: **apenas** `nome` e `endereco` (parciais: cada um
      opcional no input). **Pelo menos um** deve ser informado (P1); ambos
      omitidos → erro de validação. Campo omitido permanece o valor atual
      (P2). Validação de um campo **fornecido** segue as mesmas regras de
      `CriarClinicaComAdmin` / entidade `Clinica` (não vazio após trim).
- [ ] **Documento fiscal (CPF/CNPJ) é imutável** após a criação: o input
      **não inclui** documento / `tipoDocumento` / valor. Não há caminho
      neste caso de uso para alterar identidade do tenant.
- [ ] Justificativa (espelha decisão 13 de `AtualizarPaciente` na 002):
      documento é campo de **identidade/deduplicação** (único na
      plataforma). Edição livre abriria risco de “corrigir” para o
      CPF/CNPJ de outra clínica e **mesclar o tenant errado**. Correção
      de documento informado errado = fluxo separado (suporte /
      super-admin), **fora desta emenda**.
- [ ] Fora deste caso de uso (já cobertos ou deliberadamente excluídos):
      `status`, `logoUrl`, `tema`, `slug`, documento.
- [ ] Distinto de `EditarClinica` (009): atores, módulo e superfície
      diferentes; o invariante de documento imutável vale para a entidade
      `Clinica` (009 já só envia nome/endereço — não reabrir 009 nesta
      emenda).
- [ ] Arquiteto: registrar no `specs/02-domain-model.md` que o documento
      fiscal da `Clinica` é imutável após criação.

### Regras de negócio
- Documento fiscal da clínica não muda depois do cadastro (identidade do
  tenant / unicidade na plataforma).
- `AtualizarClinica` não altera status, logo, tema nem slug.
- Nome/endereço fornecidos não podem ficar vazios (mesma invariante do
  cadastro).
- Pelo menos um de `nome` / `endereco` deve ser informado (P1).

### Casos de uso / ports
- `AtualizarClinica(clinicaId, nome?, endereco?) → Clinica`
  — delivery autentica e passa `solicitadoPorUsuarioId` + `clinicaId` da
  sessão (padrão dos demais use cases da 001); a assinatura de alto nível
  acima é a do pedido.
- Ports: reuso de `ClinicaRepositoryPort`, `ProfissionalRepositoryPort`
  (ator), `AutorizacaoPort` / helper `assertPode(..., "editar_clinica")`.
  **Sem** port nova.

### Fora de escopo desta emenda
- Alterar documento fiscal (qualquer ator, por esta via).
- Fluxo de correção de CPF/CNPJ digitado errado (suporte / 009).
- Logo, tema, slug, desativar clínica, multi-clínica.
- Unificar com `EditarClinica` (009) — atores diferentes.

### Plano de testes
- **Domínio:** atualizar nome e/ou endereço preserva documento, status,
  logo, tema e slug; nome/endereço vazios rejeitados; ambos omitidos
  rejeitados (P1).
- **Aplicação:** admin sucesso (só nome, só endereço, ou ambos);
  dentista/recepção permissão negada; outro tenant não altera; contrato
  de input sem documento (não é possível passar CPF/CNPJ neste use case).
- **Integração / contrato:** não exigidos além do padrão desta feature.

### Decisões aprovadas (emenda)

| # | Tema | Decisão |
|---|---|---|
| P1 | Input com ambos omitidos | **Erro de validação:** pelo menos um de `nome` / `endereco` deve ser informado. |
| P2 | Parciais vs. `EditarClinica` (009) | **Manter parciais.** Não alterar o contrato da 009. Campo omitido permanece o valor atual. |

---

## Débito técnico conhecido

- `AceitarConvite` não é atômico entre criação de usuário/profissional e
  marcação do convite como aceito. Se `profissionalRepo.salvar` suceder e
  `conviteRepo.salvar` falhar, o convite permanece "pendente" indevidamente.
  Resolver quando definirmos um padrão de transação/Unit of Work transversal
  aos módulos (provavelmente necessário também em agendamento e assinatura).
