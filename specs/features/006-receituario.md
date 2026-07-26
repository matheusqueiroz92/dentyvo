# 006 — Receituário

## Status
`rascunho`

## Contexto
Evita o dentista escrever receita à mão, reduzindo tempo de atendimento e erros
de legibilidade.

## User story
Como dentista, quero gerar uma receita a partir de um modelo padrão preenchendo
medicamento/dosagem/posologia, para entregar ao paciente de forma rápida e legível.

## Critérios de aceite
- [ ] Dentista seleciona/adiciona itens (medicamento, dosagem, posologia, duração).
- [ ] Receita gerada em PDF com cabeçalho da clínica e dados do profissional (CRO).
- [ ] Receita fica vinculada ao prontuário do paciente (histórico de receitas).
- [ ] MVP: sem assinatura digital com validade jurídica — documento é para
      impressão/envio, dentista assina fisicamente ou via ferramenta externa
      (avaliar exigência de ICP-Brasil antes de prometer assinatura digital
      válida para controlados).

## Regras de negócio
- Receita não pode ser editada após emitida — nova receita é criada em caso de
  correção (trilha de auditoria, mesma lógica de evolução do prontuário).

## Modelo de domínio envolvido
`Receita`, `Prontuario`, `Profissional`.

## Casos de uso (application layer)
- `EmitirReceita(prontuarioId, profissionalId, itens[]) → Receita`
- `GerarPdfReceita(receitaId) → arquivo`

## Ports necessárias
- `ReceitaRepositoryPort`
- `GeradorPdfPort`

## Fora de escopo
- Assinatura digital com validade jurídica (avaliar em versão futura).
- Integração com farmácias.

## Plano de testes
- Domínio: receita emitida é imutável.
- Aplicação: geração de PDF inclui todos os dados obrigatórios (CRO, itens,
  data, dados do paciente).

## Dependências
003 (prontuário).
