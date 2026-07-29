# 006 — Receituário

## Status
`aprovada`

## Contexto
Evita o dentista escrever receita à mão, reduzindo tempo de atendimento e erros
de legibilidade.

Reaproveita `ContextoSessao` e isolamento por `clinicaId` da feature 001
(`src/core/auth`) e `ProntuarioRepositoryPort` da feature 003
(`src/core/prontuario`) — **sem modificar** esses módulos. Consome
`Clinica`, `Profissional` e `Paciente` via ports existentes apenas para
montar o snapshot de cabeçalho na emissão.

## User story
Como dentista, quero gerar uma receita a partir de um modelo padrão preenchendo
medicamento/dosagem/posologia/duração, para entregar ao paciente de forma
rápida e legível.

## Critérios de aceite
- [ ] Dentista seleciona/adiciona itens estruturados (`medicamento`,
      `dosagem`, `posologia`, `duracao`); mínimo um item por receita.
- [ ] Na emissão, a `Receita` persiste um **snapshot** dos dados de cabeçalho
      (não resolve ao vivo na geração do PDF): `Clinica.nome` +
      `Clinica.endereco`, `Profissional.nome` + `Profissional.cro`,
      `Paciente.nome` + `Paciente.cpf`, mais opcionais
      `Paciente.dataNascimento` e `Profissional.especialidade` quando
      existirem. Documento fiscal da clínica **fora** do MVP.
- [ ] Receita gerada em PDF sob demanda (`GeradorPdfPort` / adapter
      `pdf-lib`), sem persistir blob; PDF inclui snapshot de cabeçalho,
      `emitidaEm` e todos os itens.
- [ ] Receita fica vinculada ao prontuário do paciente; histórico
      consultável via `ListarReceitasDoProntuario`.
- [ ] Receita emitida é imutável: não há edição in-place; correção = nova
      emissão (trilha de auditoria, mesma ideia da evolução do prontuário).
- [ ] `profissionalId` da receita emitida é sempre o de
      `ContextoSessao.profissionalId` — nunca um id arbitrário no input.
- [ ] Apenas `dentista` da mesma clínica emite, lista e gera PDF;
      `admin` e `recepcao` não têm acesso (admin que precise emitir troca
      de papel para `dentista`, com CRO).
- [ ] MVP: sem assinatura digital com validade jurídica — documento é para
      impressão/envio, dentista assina fisicamente ou via ferramenta
      externa (avaliar exigência de ICP-Brasil antes de prometer assinatura
      digital válida para controlados).

## Regras de negócio
- Receita não pode ser editada após emitida — nova receita é criada em caso
  de correção.
- Isolamento multi-tenant: toda leitura/escrita escopada por `clinicaId` da
  sessão.
- Snapshot de cabeçalho é congelado na emissão; alterações posteriores em
  clínica/profissional/paciente não alteram receitas já emitidas nem o PDF
  regenerado a partir delas.
- `EmitirReceita` usa o `profissionalId` da sessão; o input não aceita
  `profissionalId` externo.
- Itens: quatro campos de texto livre estruturados; sem catálogo de
  medicamentos nem validação farmacológica no MVP.
- `assinaturaDigitalId` permanece nullable / v2 — fora do escopo deste MVP.

## Matriz de permissões (receituário)

| Ação | admin | dentista | recepcao |
|---|---|---|---|
| Emitir receita | não | sim | não |
| Listar receitas do prontuário | não | sim | não |
| Gerar PDF da receita | não | sim | não |

## Modelo de domínio envolvido
`Receita` (com `ItemReceita` e snapshot de cabeçalho); consome
`Prontuario`, `Profissional`, `Clinica`, `Paciente` via ports — não cria
nem edita essas entidades neste módulo.

### Estrutura de módulo
- `src/core/receituario` — emissão, listagem, geração de PDF, imutabilidade.
- Schema: `db/schema/receituario.ts` (não editar `db/schema/index.ts` nesta
  feature).

### ItemReceita (MVP)
```
medicamento: string  // obrigatório
dosagem: string      // obrigatório (ex.: "500 mg")
posologia: string    // obrigatório (ex.: "1 comprimido de 8/8h")
duracao: string      // obrigatório (ex.: "7 dias")
```

### Snapshot de cabeçalho (persistido na Receita)
**Obrigatórios:** clinicaNome, clinicaEndereco, profissionalNome,
profissionalCro, pacienteNome, pacienteCpf, emitidaEm, itens.
**Opcionais:** pacienteDataNascimento, profissionalEspecialidade.
**Fora do MVP:** documento fiscal da clínica.

## Casos de uso (application layer)
- `EmitirReceita({ prontuarioId, itens[] }, contexto: ContextoSessao) → Receita`
  — `profissionalId` = `contexto.profissionalId` (não vem no input de
  negócio).
- `ListarReceitasDoProntuario({ prontuarioId }, contexto: ContextoSessao) → Receita[]`
- `GerarPdfReceita({ receitaId }, contexto: ContextoSessao) → arquivo`
  — regenera a partir da receita + snapshot persistidos; sem blob armazenado.

## Ports necessárias
- `ReceitaRepositoryPort` — persistência da receita (com snapshot e itens).
- `GeradorPdfPort` — gera PDF a partir dos dados já snapshotados da receita
  (implementação: `pdf-lib`, serverless, sem headless Chrome).
- Consumo (somente leitura, sem alterar os módulos donos):
  - `ProntuarioRepositoryPort` (003)
  - `PacienteRepositoryPort` (paciente / 002)
  - `ClinicaRepositoryPort` (001)
  - `ProfissionalRepositoryPort` (001)

## Fora de escopo
- Assinatura digital com validade jurídica (`assinaturaDigitalId` / ICP-Brasil
  — avaliar em versão futura).
- Persistência de blob/arquivo PDF.
- Documento fiscal da clínica no cabeçalho.
- Catálogo de medicamentos / validação farmacológica.
- Integração com farmácias.
- Receitas de controlados com requisitos legais específicos além do PDF
  imprimível do MVP.

## Plano de testes
- Domínio: receita emitida é imutável; item exige os quatro campos; snapshot
  de cabeçalho obrigatório presente na entidade.
- Aplicação:
  - `EmitirReceita` grava snapshot a partir das ports e amarra
    `profissionalId` da sessão (input sem `profissionalId` externo).
  - `ListarReceitasDoProntuario` retorna histórico do prontuário no tenant.
  - `GerarPdfReceita` inclui todos os dados obrigatórios do snapshot (CRO,
    itens, data, paciente, clínica) sem consultar ports de cadastro ao vivo.
  - RBAC: só `dentista`; `admin` e `recepcao` negados em emitir/listar/PDF.
  - Cross-tenant / prontuário inexistente falha sem vazar dado.

## Dependências
- 001 (auth multi-tenant): `ContextoSessao`, `ClinicaRepositoryPort`,
  `ProfissionalRepositoryPort`.
- 003 (prontuário): `ProntuarioRepositoryPort`.
- Módulo paciente (002): `PacienteRepositoryPort`.
- `src/core/shared` (erros e autorização), mesmo padrão dos outros módulos.
