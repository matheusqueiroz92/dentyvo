# 009 — Painel Administrativo da Plataforma (Super-Admin)

## Status
`rascunho`

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
- [ ] Super-admin pode listar e gerenciar usuários de qualquer clínica
      (resetar acesso, remover usuário, trocar papel).
- [ ] Toda ação do super-admin sobre dado de uma clínica gera registro de
      auditoria (reaproveita `AuditoriaLogPort` da spec 003), incluindo leitura
      de prontuário — é dado sensível mesmo sendo você o dono do sistema.
- [ ] Login de super-admin não pode ser criado via fluxo público de cadastro de
      clínica — é provisionado manualmente/via seed, nunca self-service.

## Regras de negócio
- `UsuarioPlataforma` nunca tem `clinicaId` — é a única entidade do sistema com
  acesso legitimamente cross-tenant.
- Remover uma clínica é uma ação destrutiva — exige confirmação explícita e,
  no mínimo em produção, soft-delete (não apagar fisicamente prontuário/dado
  clínico, por obrigações de guarda de registro em saúde).

## Modelo de domínio envolvido
`UsuarioPlataforma`, `Clinica`, `Profissional`.

## Casos de uso (application layer)
- `ListarClinicas(filtros?) → Clinica[]`
- `CriarClinicaManualmente(dadosClinica, dadosAdmin) → Clinica`
- `EditarClinica(clinicaId, dados) → Clinica`
- `DesativarClinica(clinicaId, motivo) → void` (soft-delete)
- `ListarUsuariosDaClinica(clinicaId) → Profissional[]`
- `RemoverUsuario(usuarioId) → void`

## Ports necessárias
- `ClinicaRepositoryPort` (reaproveitado de 001)
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

## Plano de testes
- Domínio: `UsuarioPlataforma` nunca é aceito com `clinicaId` preenchido.
- Aplicação: `DesativarClinica` bloqueia login de todos os usuários daquela
  clínica, mas não apaga prontuário.
- Integração: usuário de clínica comum não consegue acessar rota `/admin/**`
  mesmo manipulando a URL diretamente.

## Dependências
001 (auth multi-tenant), 003 (auditoria, reaproveitada).
