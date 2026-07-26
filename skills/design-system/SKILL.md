---
name: dentyvo-design-system
description: Implementa interfaces do SaaS Dentyvo de acordo com os tokens, componentes, padrões clínicos e requisitos de acessibilidade oficiais.
---

# Skill: Dentyvo Design System

Use esta skill em toda tarefa que crie ou altere interface, componente, layout, formulário, tabela, agenda, dashboard ou fluxo de usuário da Dentyvo.

## Fontes obrigatórias

Antes de implementar:
1. Leia `docs/DESIGN_SYSTEM.md`.
2. Leia `styles/tokens.css`.
3. Inspecione os primitives existentes em `components/ui`.
4. Reutilize componentes existentes antes de criar novos.

## Processo de execução

1. Identifique o domínio da tela.
2. Liste estados: loading, vazio, erro, sucesso, disabled e permission denied.
3. Escolha primitives existentes.
4. Use apenas tokens semânticos.
5. Implemente responsividade para 360, 768, 1024 e 1440 px.
6. Valide teclado, foco e labels.
7. Revise textos em português do Brasil.
8. Garanta datas, horários e valores no locale `pt-BR`.
9. Execute testes e lint disponíveis.

## Regras inegociáveis

- Não use cores hexadecimais dentro de componentes.
- Não use `div` clicável sem semântica de botão ou link.
- Não dependa exclusivamente de cor para estados.
- Não crie componentes duplicados.
- Não introduza uma nova variante sem necessidade de domínio comprovada.
- Não esconda ações essenciais apenas em hover.
- Não use modal para fluxo longo.
- Não use placeholder como label.
- Não remova foco visível.
- Não use animações que atrasem tarefas.

## Estrutura esperada

```text
components/
  ui/          # primitives genéricos
  domain/      # componentes do domínio odontológico
  layout/      # shell, sidebar, topbar
features/
  appointments/
  patients/
  clinical/
  finance/
```

## Critério de conclusão

Uma tarefa visual só está concluída quando:
- estados assíncronos estão cobertos;
- acessibilidade básica está verificada;
- responsividade está verificada;
- não há valores visuais mágicos;
- os componentes respeitam o design system;
- textos e formatação estão em pt-BR.
