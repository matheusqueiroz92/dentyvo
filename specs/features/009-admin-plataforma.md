# 009 — Painel Administrativo da Plataforma (Super-Admin)

## Status
`aprovada`

## Contexto
Você (dono/desenvolvedor da Dentyvo) precisa gerenciar todas as clínicas
cadastradas, seus usuários e o estado geral da plataforma, com um nível de
acesso que nenhuma clínica individual tem. Esse é um papel **fora** do modelo
multi-tenant normal — é cross-tenant por definição.

## User story
Como dono da Dentyvo, quero visualizar, cadastrar, editar ou remover qualquer
clínica, consultório ou usuário da plataforma, para dar suporte, corrigir
problemas e gerenciar a operação comercial do SaaS.

## Critérios de aceite
- [ ] Existe um papel `super-admin` (`UsuarioPlataforma`), separado do RBAC de
      clínica (`admin`/`dentista`/`recepcao` da spec 001).
- [ ] Super-admin acessa uma área administrativa própria (`/admin`, fora do
      layout multi-tenant normal), inacessível a usuários de clínica.
- [ ] Super-admin pode: listar todas as clínicas, ver detalhes (dados
      cadastrais, status de assinatura, usuários vinculados), criar clínica
      manualmente (ex: onboarding assistido), editar dados de clínica, e
      desativar/remover uma clínica.
- [ ] Super-admin pode listar usuários (`Profissional`) de qualquer clínica.
- [ ] Super-admin pode **remover** o vínculo de um usuário a uma clínica
      (`RemoverUsuario`).
- [ ] Super-admin pode **revogar sessões** de um usuário de clínica
      (`RevogarSessoesDoUsuario`): revoga **todas as sessões ativas** desse
      usuário no BetterAuth (mesma semântica de `RevogarSessoesDoMembro` da
      spec 001, porém cross-tenant e sem exigir que o ator seja `admin` da
      clínica). O usuário precisa autenticar de novo; a **senha continua
      válida** — ele consegue logar imediatamente com as mesmas credenciais.
      Esta ação **não** altera senha, **não** envia e-mail de reset e **não**
      gera senha temporária.
- [ ] Super-admin pode **trocar o papel** de um `Profissional` de qualquer
      clínica (`TrocarPapelUsuario`) entre `admin` | `dentista` | `recepcao`,
      respeitando as mesmas invariantes de domínio da 001 (CRO obrigatório ao
      promover/manter `dentista`).
- [ ] Toda ação do super-admin sobre dado de uma clínica gera registro de
      auditoria (reaproveita `AuditoriaLogPort` da spec 003), incluindo leitura
      de prontuário — é dado sensível mesmo sendo você o dono do sistema.
      Inclui as ações de gestão de usuário do MVP: listar, remover, revogar
      sessões e trocar papel.
- [ ] Login de super-admin não pode ser criado via fluxo público de cadastro de
      clínica — é provisionado manualmente/via seed, nunca self-service.

### Critérios de aceite futuros (próxima iteração — não bloqueiam o MVP)
- [ ] Super-admin pode **resetar senha** de um usuário de clínica
      (`ResetarSenhaUsuario`): aciona geração de senha temporária **ou** o
      fluxo de redefinição de senha em nome do usuário (invalidando a senha
      anterior). Cobre cenários que `RevogarSessoesDoUsuario` **não** resolve
      sozinho: esquecimento de senha, conta comprometida, ou saída da clínica
      com credencial ainda válida.

## Regras de negócio
- `UsuarioPlataforma` nunca tem `clinicaId` — é a única entidade do sistema com
  acesso legitimamente cross-tenant.
- Autorização deste módulo é **binária** (ator é `UsuarioPlataforma` com papel
  `super-admin` ou não). Não reutiliza a matriz RBAC de clínica da 001
  (`admin`/`dentista`/`recepcao`) para autorizar o super-admin; o middleware
  `/admin/**` e os casos de uso checam identidade de plataforma.
- Remover uma clínica é uma ação destrutiva — exige confirmação explícita e,
  no mínimo em produção, soft-delete (não apagar fisicamente prontuário/dado
  clínico, por obrigações de guarda de registro em saúde).
- `DesativarClinica` coloca a clínica em `status: inativa`, revoga sessões de
  **todos** os membros daquela clínica e **não** apaga prontuário.
- **Revogar sessões** (`RevogarSessoesDoUsuario`) invalida apenas sessões
  BetterAuth ativas do usuário-alvo. A senha permanece válida; um novo login
  com as mesmas credenciais tem sucesso. Não confundir com reset de senha.
- **Trocar papel** altera apenas o `papel` (e CRO quando aplicável) do
  `Profissional` na clínica indicada. Não cria/remove usuário BetterAuth, não
  troca a clínica do vínculo e não revoga sessões automaticamente (se o
  suporte quiser derrubar a sessão após mudança de papel, chama
  `RevogarSessoesDoUsuario` em seguida — ou a UI pode oferecer as duas ações).
- Papéis válidos no `TrocarPapelUsuario`: os mesmos da 001 —
  `admin` | `dentista` | `recepcao`. Promover para `dentista` sem CRO válido
  falha com erro de domínio (`CroObrigatorioError` / equivalente).
- `RemoverUsuario` remove o vínculo `Profissional` (e o acesso àquela clínica);
  não apaga prontuários/evoluções associados historicamente ao profissional.
- Super-admin **não** é membro de clínica: não aparece em
  `ListarUsuariosDaClinica` e não pode receber papel `admin`/`dentista`/
  `recepcao` via `TrocarPapelUsuario`.

## Modelo de domínio envolvido
`UsuarioPlataforma`, `Clinica`, `Profissional`.

## Casos de uso (application layer)
- `ListarClinicas(filtros?) → Clinica[]`
- `CriarClinicaManualmente(dadosClinica, dadosAdmin) → Clinica`
- `EditarClinica(clinicaId, dados) → Clinica`
- `DesativarClinica(clinicaId, motivo) → void` (soft-delete)
- `ListarUsuariosDaClinica(clinicaId) → Profissional[]`
- `RemoverUsuario(usuarioId) → void`
- `RevogarSessoesDoUsuario(usuarioId) → void`
  — revoga todas as sessões ativas do usuário BetterAuth identificado por
  `usuarioId`; falha se o usuário não existir ou não estiver vinculado a
  nenhuma clínica como `Profissional`. Não altera senha.
- `TrocarPapelUsuario(clinicaId, profissionalId, novoPapel, cro?) → Profissional`
  — altera o papel do membro na clínica alvo; `cro` obrigatório na promoção
  para `dentista` se o profissional ainda não tiver CRO.

Todos os casos acima (MVP) exigem ator `UsuarioPlataforma` (`super-admin`) e
registram auditoria.

### Próxima iteração (não implementar agora)
- `ResetarSenhaUsuario(usuarioId) → void`
  — super-admin aciona geração de senha temporária **ou** o fluxo de
  redefinição de senha em nome do usuário (invalidando a credencial anterior).

> **Por que a divisão:** `RevogarSessoesDoUsuario` só desconecta sessões ativas;
> a senha continua valendo e a pessoa loga de novo na hora. Isso **não** cobre
> esquecimento de senha, comprometimento de conta nem saída da clínica com
> credencial ainda utilizável. Nomear a ação de revogação de forma honesta
> evita que suporte/UI usem “revogar sessões” achando que resolve esses
> cenários. O reset de senha fica como caso de uso futuro explícito
> (`ResetarSenhaUsuario`), não como alias enganoso do MVP.

## Ports necessárias
- `ClinicaRepositoryPort` (reaproveitado de 001; inclui listagem cross-tenant)
- `ProfissionalRepositoryPort` (reaproveitado de 001)
- `AuthPort` (reaproveitado de 001 — criar usuário no onboarding assistido;
  `revogarSessoesDoUsuario` para `RevogarSessoesDoUsuario` / `DesativarClinica`)
- `UsuarioPlataformaRepositoryPort`
- `AuditoriaLogPort` (reaproveitado de 003)

## Contrato de API
- Rotas sob `src/app/admin/**`, protegidas por middleware que exige
  `papel = super-admin` — nunca reaproveitar o middleware de tenant comum.

## Fora de escopo
- Múltiplos níveis de admin (ex: "admin" vs "suporte" com permissões
  diferentes) — no MVP existe só `super-admin`, provisionado só pra você.
- Dashboard de métricas de negócio (MRR, churn) — pode vir junto com a
  spec 010 (assinatura/pagamento), como v2.
- `ResetarSenhaUsuario` (senha temporária / fluxo de redefinição em nome do
  usuário) — **próxima iteração**; ver critérios futuros e nota na seção de
  casos de uso. No MVP, gestão de acesso imediato = `RevogarSessoesDoUsuario`
  (só sessões) e/ou `RemoverUsuario` / `DesativarClinica` quando o vínculo ou
  a clínica devem deixar de autenticar.
- Impersonação de usuário de clínica (login-as) — fora do MVP.

## Plano de testes
- Domínio: `UsuarioPlataforma` nunca é aceito com `clinicaId` preenchido.
- Aplicação: `DesativarClinica` bloqueia login de todos os usuários daquela
  clínica (sessões revogadas + clínica `inativa`), mas não apaga prontuário.
- Aplicação: `RevogarSessoesDoUsuario` chama revogação de sessões do
  `usuarioId` alvo e registra auditoria; **não** altera senha nem papel.
- Aplicação: `TrocarPapelUsuario` promove para `dentista` sem CRO e falha;
  com CRO válido, persiste o novo papel e registra auditoria; não revoga
  sessões por si só.
- Integração: usuário de clínica comum não consegue acessar rota `/admin/**`
  mesmo manipulando a URL diretamente.

## Dependências
001 (auth multi-tenant), 003 (auditoria, reaproveitada).
