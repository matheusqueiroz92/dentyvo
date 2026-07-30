# Design System Dentyvo — v1.0

## 1. Fundamentos da marca

### Posicionamento
Dentyvo é o centro operacional da clínica odontológica: agenda, pacientes, prontuário, financeiro e relacionamento em uma experiência integrada.

### Personalidade
- Confiável, sem parecer burocrática.
- Tecnológica, sem parecer fria.
- Clínica, sem depender de clichês visuais.
- Eficiente, organizada e acessível.

### Princípios de interface
1. **Clareza antes de decoração:** a próxima ação deve ser imediatamente identificável.
2. **Segurança clínica:** ações destrutivas, dados sensíveis e mudanças de status exigem confirmação e feedback.
3. **Eficiência operacional:** fluxos frequentes devem exigir poucos cliques.
4. **Consistência semântica:** a mesma cor e o mesmo componente sempre comunicam a mesma ideia.
5. **Acessibilidade por padrão:** contraste, foco, teclado e textos auxiliares não são opcionais.
6. **Responsividade real:** desktop para operação intensiva; mobile para consulta e ações rápidas.

---

## 2. Identidade visual

A paleta foi derivada da identidade da logomarca Dentyvo.

### Cores da marca

| Token | HEX | Uso |
|---|---:|---|
| Navy 950 | `#07143F` | Marca, títulos e superfícies escuras |
| Navy 900 | `#0A1643` | Texto principal, sidebar |
| Blue 600 | `#0863C5` | Ações primárias e links |
| Blue 500 | `#108ECB` | Destaques e estados ativos |
| Cyan 500 | `#0EB6C6` | Tecnologia, automação e apoio visual |
| Teal 400 | `#18C7B8` | Gradiente da marca e sucesso auxiliar |
| Slate 50 | `#F7F9FC` | Fundo da aplicação |
| Slate 100 | `#EDF2F7` | Superfícies secundárias |
| Slate 200 | `#DFE7EF` | Bordas |
| Slate 600 | `#526176` | Texto secundário |
| White | `#FFFFFF` | Cards, modais e campos |

### Gradiente principal
```css
linear-gradient(135deg, #0863C5 0%, #108ECB 48%, #18C7B8 100%)
```

Use o gradiente somente em:
- assinatura visual;
- ícones de marca;
- estados especiais de onboarding;
- destaques pontuais.

Não use o gradiente como fundo de tabelas, formulários ou áreas extensas.

### Cores semânticas

| Estado | Cor base | Fundo claro |
|---|---:|---:|
| Sucesso | `#16875B` | `#EAF8F1` |
| Atenção | `#B56A00` | `#FFF6E6` |
| Erro | `#C93B4A` | `#FDEDEF` |
| Informação | `#0863C5` | `#EAF3FF` |
| Neutro | `#526176` | `#F1F4F8` |

#### Semântica clínica sugerida
- Consulta confirmada: sucesso.
- Aguardando confirmação: atenção.
- Cancelada ou falta: erro.
- Em atendimento: informação.
- Finalizada: neutro positivo, sem excesso de verde.
- Bloqueio de agenda: neutro escuro.

Nunca comunique estado apenas pela cor. Use ícone, texto ou padrão visual complementar.

---

## 3. Tipografia

### Família principal
**Inter** é a fonte padrão da aplicação.

Fallback:
```css
font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

### Família de números
Use `font-variant-numeric: tabular-nums` em:
- horários;
- valores financeiros;
- indicadores;
- tabelas;
- códigos e números de documento.

### Escala tipográfica

| Token | Tamanho/linha | Peso | Uso |
|---|---|---:|---|
| display | 36/44 | 700 | Onboarding e estados especiais |
| h1 | 30/38 | 700 | Título principal da página |
| h2 | 24/32 | 700 | Seções importantes |
| h3 | 20/28 | 600 | Cards e subseções |
| title | 16/24 | 600 | Títulos de componentes |
| body | 14/22 | 400 | Texto padrão |
| body-sm | 13/20 | 400 | Tabelas e informações compactas |
| label | 13/18 | 500 | Labels de formulário |
| caption | 12/18 | 400 | Ajuda, datas e metadados |
| overline | 11/16 | 600 | Categorias e pequenos rótulos |

Evite fontes abaixo de 12 px em interfaces operacionais.

---

## 4. Espaçamento e layout

### Base
Escala de 4 px:
`0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80`

### Layout desktop
- Sidebar expandida: 256 px.
- Sidebar recolhida: 72 px.
- Topbar: 64 px.
- Conteúdo máximo: 1600 px.
- Padding da página: 24–32 px.
- Gap de grid: 16–24 px.

### Breakpoints
- Mobile: `< 640 px`
- Tablet: `640–1023 px`
- Desktop: `1024–1439 px`
- Wide: `≥ 1440 px`

### Densidade
O produto pode oferecer:
- `comfortable`: linhas de tabela com 48 px.
- `compact`: linhas de tabela com 40 px.

A densidade compacta não deve reduzir alvos interativos abaixo de 36 px.

---

## 5. Formas, bordas e elevação

### Raios
- `xs`: 4 px — chips internos.
- `sm`: 6 px — campos compactos.
- `md`: 8 px — botões e inputs.
- `lg`: 12 px — cards.
- `xl`: 16 px — modais e painéis.
- `full`: 9999 px — avatares e badges.

### Bordas
- Padrão: 1 px.
- Foco: anel externo de 3 px com transparência.
- Separadores: prefira bordas a sombras.

### Sombras
- `sm`: cards flutuantes discretos.
- `md`: dropdowns e popovers.
- `lg`: modais.
- Evite sombras em todos os cards; a aplicação deve parecer estruturada, não “flutuante”.

---

## 6. Iconografia

Biblioteca padrão: **Lucide React**.

Regras:
- 16 px em botões compactos e campos.
- 18 px em botões padrão.
- 20 px em navegação.
- 24 px em cabeçalhos e empty states.
- Stroke padrão: 1.75–2.
- Ícones decorativos devem usar `aria-hidden`.
- Ações críticas não podem depender apenas de ícone sem tooltip ou label.

Ícones sugeridos:
- Agenda: `CalendarDays`
- Pacientes: `UsersRound`
- Prontuário: `ClipboardPlus`
- Odontograma: `ScanLine`
- Financeiro: `WalletCards`
- Relatórios: `ChartNoAxesCombined`
- Configurações: `Settings`
- Automação/IA: `Sparkles`
- Clínica: `Building2`

---

## 7. Componentes

### Button

Variantes:
- `primary`: ação principal da página.
- `secondary`: ação relevante sem prioridade máxima.
- `outline`: ações auxiliares.
- `ghost`: navegação e ações discretas.
- `danger`: exclusão, cancelamento irreversível.
- `link`: navegação textual.

Tamanhos:
- `sm`: 32 px.
- `md`: 40 px.
- `lg`: 44 px.
- `icon`: 40 × 40 px.

Regras:
- Máximo de uma ação `primary` por área contextual.
- Use verbo no infinitivo ou ação direta: “Salvar paciente”, “Confirmar consulta”.
- Estado loading preserva a largura e substitui o ícone por spinner.
- Botões destrutivos só usam vermelho quando a ação é realmente destrutiva.

### Input, Select e Textarea

Altura padrão: 40 px.

Estados:
- default;
- hover;
- focus;
- disabled;
- read-only;
- error;
- success, apenas quando útil.

Estrutura:
1. Label.
2. Controle.
3. Texto de ajuda ou erro.
4. Contador, quando aplicável.

Placeholders não substituem labels.

Campos sensíveis:
- CPF, telefone, CEP e CRO podem usar máscara visual.
- Armazene valores normalizados.
- Datas devem respeitar `pt-BR`.
- Use autocomplete adequado.

### Checkbox, Radio e Switch
- Checkbox: seleção múltipla.
- Radio: uma opção entre poucas escolhas.
- Switch: mudança imediata de estado.
- Não use switch para uma ação que só será aplicada após “Salvar”.

### Card
Variantes:
- `surface`: agrupamento padrão.
- `interactive`: clicável, com hover e foco.
- `metric`: KPI.
- `danger`: alerta crítico.
- `highlight`: onboarding ou recurso novo.

Card não deve ser usado apenas como decoração. Cada card precisa agrupar uma unidade de informação ou ação.

### Badge e Status
Formato: ícone opcional + texto curto.

Exemplos:
- Confirmada
- Aguardando
- Em atendimento
- Finalizada
- Cancelada
- Faltou
- Retorno

Use badges preenchidos suavemente; evite grandes áreas saturadas.

### Alert
Variantes:
- info;
- success;
- warning;
- error.

Alertas persistentes ficam dentro do fluxo. Toasts são usados para feedback breve após ações.

### Toast
- Sucesso: 4–5 segundos.
- Erro: persistente o suficiente para leitura ou até ação do usuário.
- Mensagem objetiva e orientada à consequência.
- Erros com correção possível devem incluir uma ação.

### Dialog
- Confirmações simples: largura 420–480 px.
- Formulários: 560–720 px.
- Fluxos complexos devem usar página ou drawer, não modal excessivo.
- O botão de cancelar fica à esquerda da ação principal.
- Exclusões exigem descrição clara da consequência.

### Drawer / Sheet
Use para:
- visualizar detalhes sem sair da lista;
- filtros;
- edição rápida;
- painel lateral da agenda.

No mobile, drawers podem ocupar toda a tela.

### Table / Data Grid
Obrigatório para pacientes, financeiro e registros clínicos.

Recursos:
- cabeçalho fixo quando necessário;
- ordenação;
- filtros;
- busca;
- seleção em lote;
- paginação;
- estado vazio;
- skeleton;
- colunas configuráveis, em tabelas complexas.

Regras:
- Texto principal à esquerda.
- Números e valores à direita.
- Datas e status com alinhamento consistente.
- Ações na última coluna.
- Não esconda informações essenciais somente em hover.

### Tabs
Use para alternar visões do mesmo contexto:
- Dados gerais
- Histórico
- Prontuário
- Financeiro
- Documentos

Não use tabs como navegação global.

### Tooltip
Use para explicar:
- ícones sem texto;
- termos clínicos incomuns;
- informações truncadas.

Não coloque conteúdo indispensável exclusivamente no tooltip.

### Avatar
- Foto quando disponível.
- Fallback com iniciais.
- Cores de fallback determinísticas.
- Tamanhos: 24, 32, 40 e 48 px.

### Empty State
Estrutura:
1. Ícone ou ilustração simples.
2. Título claro.
3. Explicação curta.
4. Ação primária, quando aplicável.

Exemplo: “Nenhuma consulta hoje. Crie um agendamento ou altere os filtros.”

### Skeleton
Skeleton deve aproximar a estrutura real. Não use spinner central para carregamentos de páginas inteiras.

---

## 8. Padrões específicos da Dentyvo

### Agenda

#### Visualizações
- Dia.
- Semana.
- Lista.
- Opcional: mês apenas para visão gerencial.

#### Evento de consulta
Exibir:
- horário;
- paciente;
- procedimento resumido;
- profissional;
- status;
- indicador de convênio ou particular quando relevante.

Não use apenas a cor para identificar o status.

#### Conflitos
Conflitos de horário devem:
- impedir salvamento quando inválidos;
- mostrar qual profissional, cadeira ou recurso está ocupado;
- oferecer horários alternativos quando possível.

#### Cores de profissionais
As cores de profissionais são secundárias e não podem conflitar com as cores semânticas de status.

### Cadastro de paciente

Organização recomendada:
1. Identificação.
2. Contato.
3. Endereço.
4. Responsável.
5. Convênio.
6. Observações e alertas.
7. Consentimentos.

Use preenchimento progressivo. Não transforme o primeiro cadastro em um formulário excessivo.

### Prontuário

Características:
- ordem cronológica;
- autoria e data visíveis;
- registros clínicos não devem parecer editáveis após consolidação;
- alterações relevantes devem possuir histórico;
- alertas clínicos devem aparecer com destaque controlado;
- anexos e imagens precisam de identificação e data.

### Odontograma
- Alto contraste.
- Estados acompanhados por legenda.
- Seleção por dente e face.
- Histórico de alterações.
- Não depender de tooltips para o estado atual.
- Garantir operação por teclado sempre que tecnicamente viável.

### Financeiro
- Valores em `R$`, usando locale `pt-BR`.
- Positivos e negativos não devem depender somente de verde/vermelho.
- Diferencie: previsto, recebido, vencido, cancelado e estornado.
- Exija confirmação para estornos e exclusões.
- Utilize números tabulares.

### Dashboard
Priorize:
- agenda do dia;
- pacientes aguardando;
- confirmações pendentes;
- faturamento resumido;
- contas vencidas;
- próximos retornos;
- alertas operacionais.

Evite dashboards com muitos gráficos sem ação associada.

---

## 9. Navegação

### Sidebar
Grupos recomendados:
- Visão geral
- Agenda
- Pacientes
- Clínico
  - Prontuários
  - Odontograma
  - Planos de tratamento
- Financeiro
- Relatórios
- Relacionamento
- Configurações

A clínica ou unidade atual deve ficar visível no topo.

### Topbar
Itens:
- breadcrumb ou contexto da página;
- busca global;
- ações rápidas;
- notificações;
- usuário;
- alternância de unidade, quando multiunidade.

### Busca global
Deve encontrar:
- pacientes;
- consultas;
- telefones;
- documentos;
- planos de tratamento.

Use atalho `Ctrl/Cmd + K`.

---

## 10. Formulários e validação

### Princípios
- Valide no blur e no submit.
- Não mostre erro antes de interação.
- Posicione a mensagem próxima ao campo.
- Preserve os dados quando houver erro.
- Foque o primeiro campo inválido ao submeter.
- Campos obrigatórios devem ser indicados de modo consistente.

### Mensagens
Ruim: “Valor inválido”.
Bom: “Informe um telefone com DDD.”

Ruim: “Erro 409”.
Bom: “Este horário já está ocupado para a profissional selecionada.”

---

## 11. Acessibilidade

Meta mínima: WCAG 2.2 AA.

Obrigatório:
- contraste mínimo adequado;
- foco visível;
- navegação por teclado;
- labels programáticos;
- mensagens de erro associadas;
- `aria-live` para feedback assíncrono;
- alvos de toque de pelo menos 44 px no mobile;
- suporte a redução de movimento;
- gráficos com resumo textual;
- ordem de tabulação lógica;
- modais com foco preso e retorno ao gatilho.

---

## 12. Movimento

Duração:
- microinteração: 120–160 ms.
- componente: 180–220 ms.
- painel/modal: 240–300 ms.

Easing:
```css
cubic-bezier(0.2, 0, 0, 1)
```

Evite:
- animações decorativas recorrentes;
- parallax;
- transições que atrasem tarefas;
- movimento em informações clínicas críticas.

---

## 13. Tema escuro

O tema escuro é opcional no MVP, mas os tokens já o suportam.

Regras:
- não inverter cores diretamente;
- preservar hierarquia entre fundo e superfícies;
- reduzir saturação de cores semânticas;
- manter textos clínicos com contraste forte;
- evitar preto puro em grandes áreas.

---

## 14. Responsividade

### Desktop
Experiência operacional completa:
- sidebar;
- tabelas;
- agenda semanal;
- painéis simultâneos.

### Tablet
- sidebar recolhível;
- tabelas com colunas prioritárias;
- agenda de dia ou lista.

### Mobile
Prioridades:
- agenda do dia;
- busca de paciente;
- confirmação;
- check-in;
- observação rápida;
- contato por telefone ou WhatsApp.

Tabelas devem virar lista estruturada ou permitir scroll horizontal controlado. Não comprima todas as colunas.

---

## 15. Convenções de implementação

### Nomenclatura
Use componentes em PascalCase:
- `PatientCard`
- `AppointmentStatusBadge`
- `FinancialSummary`

Props descrevem intenção:
- `isLoading`
- `isDisabled`
- `status`
- `onConfirm`

Evite props puramente visuais como `blue`, `roundedBig` ou `marginTop`.

### Tokens
Sempre preferir:
```tsx
className="bg-background text-foreground border-border"
```

Evitar:
```tsx
className="bg-[#F7F9FC] text-[#0A1643]"
```

### Composição
- Componentes primitives ficam em `components/ui`.
- Componentes de domínio ficam em `components/domain`.
- Layouts em `components/layout`.
- Não misture acesso a dados dentro de primitives.
- Estados de loading, vazio e erro devem ser previstos no mesmo fluxo.

### Internacionalização
Mesmo que o MVP seja em português:
- não concatene frases;
- não codifique datas manualmente;
- use `Intl.DateTimeFormat`;
- use `Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })`.

---

## 16. Checklist de aceite visual

Antes de concluir uma tela:
- [ ] Usa apenas tokens semânticos.
- [ ] Possui estados loading, vazio e erro.
- [ ] Funciona por teclado.
- [ ] Foco está visível.
- [ ] Textos e números possuem hierarquia clara.
- [ ] A ação principal é evidente.
- [ ] Ações destrutivas possuem confirmação.
- [ ] Layout funciona em 360, 768, 1024 e 1440 px.
- [ ] Datas e valores usam locale pt-BR.
- [ ] Não depende apenas de cor.
- [ ] Componentes reutilizam primitives existentes.
- [ ] Sem valores mágicos desnecessários.

---

## 17. Landing Page / Marketing

Superfícies públicas (landing, páginas institucionais) usam os mesmos tokens
e primitives do produto. Não invente paleta paralela nem tipografia fora da
escala Inter.

### Ordem canônica das seções (landing)

1. Header
2. Hero
3. O problema (antes vs depois)
4. Features em destaque
5. Planos / preços
6. (Opcional) Como funciona, FAQ, Contato
7. Rodapé institucional

A página em `src/app/(marketing)/page.tsx` apenas compõe essas seções — ver
seção 18.

### Hero

| Elemento | Conteúdo / regra |
|---|---|
| Marca | Sinal claro de “Dentyvo” (texto com `brand-gradient-text` ou logo) |
| Headline | “Sua clínica nunca mais deixa um paciente sem resposta.” |
| Subtítulo | “Agendamento, prontuário e uma secretária virtual no WhatsApp que atende por você — mesmo quando não há ninguém na recepção.” |
| CTA primário | “Começar agora” → cadastro de clínica (`/cadastro`) |
| CTA secundário | “Ver planos” → âncora `#planos` |
| Visual de apoio | Ilustração ou mock leve (ex.: conversa da secretária virtual); sem cards decorativos soltos no hero além do visual de produto |

Regras:
- Uma ação `primary` por contexto (CTA de cadastro).
- Alvos de toque ≥ 44 px no mobile.
- Background pode usar radiais suaves com tokens de marca; sem HEX hardcoded.

### Seção “O problema”

| Elemento | Conteúdo |
|---|---|
| Título | “Papel, planilha, retrabalho. Você conhece bem.” |
| Corpo | “Muitas clínicas ainda perdem tempo precioso preenchendo anamnese à mão, procurando prontuário em pasta física, ou tentando lembrar quem confirmou a consulta de amanhã. A Dentyvo resolve isso.” |
| Layout | Preferir contraste **antes vs depois** (ícones + texto), não só bloco tipográfico |

Status nunca é só cor: ícone + rótulo (“Antes” / “Com a Dentyvo”).

### Features em destaque

Cards com ícone Lucide + título + descrição curta. Conjunto mínimo:

- Agendamento inteligente
- Prontuário digital completo (odontograma e periograma)
- Secretária virtual via WhatsApp
- Assinatura simples com PIX

Usar `Card` de `components/ui`. Gradiente da marca só no ícone/assinatura, não no fundo do card inteiro.

### Card de plano / preço (`PricingCard`)

Primitive em `src/components/ui/PricingCard.tsx` (não em marketing).

Props típicas: nome, descrição, faixa de preço cheio (`precoMinMensal` /
`precoMaxMensal`), preço promocional opcional, lista de recursos, CTA,
`destaque`, `badge`.

Planos da landing:

| Plano | Faixa mensal | Conteúdo |
|---|---|---|
| Básico | R$ 79–99 | Agendamento, prontuário, anamnese, receituário |
| Médio | R$ 149–179 | Tudo do Básico + bot de WhatsApp; badge **“Mais popular”** |
| Full | R$ 249–299 | Tudo do Médio + profissionais ilimitados + suporte prioritário + odontograma/periograma completos |

Texto de apoio acima dos cards:
- Título: “Gestão completa, sem o preço de plataforma grande.”
- Subtítulo: “Feita para o tamanho real da sua clínica — não para redes gigantes.”

Valores com `Intl.NumberFormat("pt-BR")` / `formatBRL` e `font-variant-numeric: tabular-nums` (classe `.numeric`).

### Indicador de urgência / escassez (promoção de lançamento)

Banner ou callout acima dos cards (não só cor):

- Escopo: **30 primeiras clínicas**
- Básico: **R$ 59/mês** e Médio: **R$ 99/mês** por **12 meses**
- Depois migra para o preço cheio do plano
- Usar badge + texto (`role="status"`); alinhar números às constantes de
  `src/core/assinatura/domain/constants` quando possível

Não inventar contadores animados ou countdown falso.

### Prova social

Quando houver depoimentos ou logos de clínicas:

- Citação + identificação (nome / papel / clínica), nunca só estrelas por cor
- Preferir seção dedicada; no MVP pode ficar fora da landing até haver conteúdo real
- Evitar métricas decorativas sem decisão associada

### Rodapé institucional

- Marca + frase de posicionamento
- Links de produto (âncoras e cadastro)
- Contato (e-mail)
- Copyright com ano via `Intl.DateTimeFormat("pt-BR")`

Fundo escuro permitido com token Navy 950; texto com contraste adequado
(`primary-foreground` / opacidades semânticas).

### Responsividade

Landing deve funcionar em **360, 768, 1024 e 1440 px**. Em mobile: CTAs
empilhados, cards de plano em coluna, nav compacta.

### Conteúdo estático

Landing é majoritariamente estática. Server actions / next-safe-action só se
um CTA exigir chamada real (ex.: formulário de contato futuro).

---

## 18. Convenção de Componentização

### Princípio

Toda página composta por múltiplas seções visuais deve dividir **cada seção
em um componente próprio**. A rota (`page.tsx`) só importa e compõe — não
cresce como arquivo monolítico com markup de várias seções.

O mesmo princípio vale para **qualquer** página futura do produto (dashboard,
agenda, prontuário, admin etc.): nenhuma página deve virar um único arquivo
grande.

### Marketing — estrutura de pastas

```
src/components/marketing/
  HeroSection.tsx
  ProblemSection.tsx
  FeaturesSection.tsx
  PricingSection.tsx
  HowItWorksSection.tsx   # quando existir na landing
  FaqSection.tsx          # quando existir na landing
  ContactSection.tsx      # quando existir na landing
  Header.tsx
  Footer.tsx

src/app/(marketing)/page.tsx
  → apenas importa e compõe as seções em ordem
```

`layout.tsx` do route group pode montar `Header` + `Footer` em volta de
`children`; a `page` permanece só com o miolo (hero → … → planos / extras).

### Primitives compartilhados

Ficam em `src/components/ui` e são reutilizáveis por qualquer página — não só
marketing:

- `Button` / `ButtonLink`
- `Badge`
- `Card` (+ Header / Title / Content / Footer)
- `PricingCard`
- `Accordion` (FAQ e painéis colapsáveis do produto)

Componentes de domínio clínico continuam em `src/components/domain`.
Layouts de shell do app (sidebar, topbar) em `src/components/layout`.

### Anti-padrões

- Página com centenas de linhas misturando hero, pricing e footer
- Duplicar `PricingCard` ou botões só dentro de `marketing/`
- Seção “lógica de UI” inline na `page.tsx` além da composição
- Inventar pasta paralela de primitives por feature
