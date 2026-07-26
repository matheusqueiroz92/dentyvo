# 003 — Prontuário Eletrônico e Anamnese Digital

## Status
`rascunho`

## Contexto
Substitui a ficha de papel do paciente. É o registro clínico central, com
auditoria obrigatória por ser dado de saúde (LGPD).

## User story
Como dentista, quero preencher a anamnese e registrar evoluções do paciente
digitalmente, para ter histórico completo e acessível sem depender de papel.

## Critérios de aceite
- [ ] Cada paciente tem um prontuário único, criado automaticamente no primeiro
      atendimento (ou no cadastro).
- [ ] Anamnese é um formulário estruturado (histórico médico, alergias, medicações
      em uso, condições preexistentes) vinculado ao prontuário.
- [ ] Cada atendimento gera uma "evolução" (registro datado, vinculado ao
      profissional e, se aplicável, ao procedimento realizado).
- [ ] Todo acesso de leitura/escrita ao prontuário é registrado em log de
      auditoria (quem, quando, o quê).
- [ ] Apenas usuários da mesma clínica do paciente acessam o prontuário.

## Regras de negócio
- Anamnese pode ser atualizada ao longo do tempo, mas mantém histórico de versões
  anteriores (não sobrescreve silenciosamente — relevante clinicamente e para
  auditoria).
- Evolução, uma vez registrada, não pode ser apagada — apenas retificada com novo
  registro (trilha de auditoria imutável).

## Modelo de domínio envolvido
`Prontuario`, `Anamnese`, `Paciente`.

## Casos de uso (application layer)
- `CriarProntuario(pacienteId) → Prontuario`
- `PreencherAnamnese(prontuarioId, respostas, preenchidoPor) → Anamnese`
- `RegistrarEvolucao(prontuarioId, descricao, profissionalId, procedimentoId?) → Evolucao`
- `ConsultarProntuario(prontuarioId, solicitanteId) → Prontuario` (registra auditoria)

## Ports necessárias
- `ProntuarioRepositoryPort`
- `AuditoriaLogPort`

## Fora de escopo
- Odontograma e periograma (features 004 e 005, v2).
- Anexos de exames/imagens (v2).

## Plano de testes
- Domínio: evolução não pode ser apagada, apenas retificada.
- Aplicação: `ConsultarProntuario` sempre gera entrada de auditoria, mesmo em
  caso de leitura simples.
- Integração: tentativa de acesso por usuário de outra clínica é bloqueada e
  também gera log (tentativa negada).

## Dependências
001 (auth multi-tenant).
