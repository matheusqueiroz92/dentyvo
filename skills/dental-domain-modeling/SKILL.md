# Skill: Modelagem de domínio odontológico

Use esta skill ao trabalhar em prontuário, anamnese, odontograma, periograma ou
receituário — módulos com terminologia clínica específica.

## Vocabulário de domínio (usar exatamente estes termos no código)

| Termo | Definição |
|---|---|
| Anamnese | Formulário de histórico médico/odontológico do paciente, preenchido antes/no início do tratamento |
| Evolução | Registro datado de um atendimento, parte do prontuário |
| Odontograma | Mapa do estado de cada dente/face (numeração + condição) |
| Periograma | Registro de medições periodontais (sondagem, sangramento, mobilidade) |
| Procedimento | Um serviço odontológico específico (ex: "Restauração", "Profilaxia"), com duração e valor padrão |
| CRO | Registro profissional do dentista no Conselho Regional de Odontologia |

## Regras a validar sempre com fonte clínica antes de travar modelo de dados

Odontograma e periograma têm convenções clínicas específicas (numeração de dentes
FDI vs. Universal, faces dentárias, escalas de mobilidade) que variam por
formação/preferência do profissional. **Não assuma uma convenção sem confirmar**
— essas specs (004, 005) estão marcadas como rascunho justamente por isso. Ao
implementar, primeiro pergunte/documente a convenção escolhida na própria spec
antes de gerar entidades e migrations.

## Sensibilidade de dado

Todo dado dentro de `core/prontuario`, `core/anamnese`, `core/odontograma`,
`core/periograma` e `core/receituario` é dado de saúde (LGPD, dado sensível):
- Nunca logar conteúdo clínico em texto plano em logs de aplicação.
- Toda leitura deve passar por `AuditoriaLogPort` (ver spec 003).
- Testes de integração podem usar dados sintéticos, nunca dados reais de paciente.
