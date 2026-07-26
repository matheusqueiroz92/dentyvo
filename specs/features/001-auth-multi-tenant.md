# 001 — Autenticação Multi-Tenant

## Status
`rascunho`

## Contexto
A plataforma atende múltiplas clínicas (tenants). É preciso autenticar usuários e
garantir isolamento total de dados entre clínicas diferentes.

## User story
Como dono de clínica, quero criar uma conta para minha clínica e convidar minha
equipe, para que cada pessoa acesse só os dados da minha clínica com o nível de
permissão adequado.

## Critérios de aceite
- [ ] Um novo cadastro de clínica cria o tenant e o usuário admin inicial.
- [ ] Admin da clínica pode convidar novos usuários (recepção, dentista) por e-mail.
- [ ] Usuário autenticado só consegue ler/escrever dados da própria clínica
      (checagem de tenant em toda query, não só na UI).
- [ ] Existem no mínimo 3 papéis: `admin`, `dentista`, `recepcao`, com permissões
      diferentes (ex: só `admin`/`dentista` acessam prontuário completo).
- [ ] Sessão expira e pode ser revogada.

## Regras de negócio
- Um usuário pertence a exatamente uma clínica (sem multi-clínica por usuário no MVP).
- Toda operação de leitura/escrita em dados de paciente/agendamento/prontuário deve
  ser escopada por `clinicaId` da sessão atual — falha se não houver correspondência.

## Modelo de domínio envolvido
`Clinica`, `Profissional` (vínculo usuário-clínica-papel).

## Casos de uso (application layer)
- `CriarClinicaComAdmin(dadosClinica, dadosAdmin) → Clinica`
- `ConvidarUsuario(clinicaId, email, papel) → Convite`
- `AceitarConvite(tokenConvite, senha) → Usuario`

## Ports necessárias
- `UsuarioRepositoryPort`
- `ClinicaRepositoryPort`
- `EmailPort` (envio do convite)

## Fora de escopo
- Multi-clínica por usuário (um dentista atuando em duas clínicas diferentes).
- SSO/login social.

## Plano de testes
- Domínio: regra "usuário pertence a uma única clínica".
- Aplicação: caso de uso de convite gera token válido e expira corretamente.
- Integração: query com `clinicaId` diferente do da sessão retorna vazio/erro,
  nunca dado de outro tenant.

## Dependências
Nenhuma — é a base para todas as outras features.
