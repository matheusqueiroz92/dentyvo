# Modelo de Domínio

Entidades centrais e suas relações. Nomes de tabelas/entidades devem seguir esses
termos (português), conforme `.cursor/rules/code-standards.mdc`.

## Entidades principais

### Clinica (tenant)
- id, nome, cnpj, endereço, plano de assinatura, status

### Profissional
- id, clinicaId, nome, cro (registro no conselho), especialidade, usuarioId (auth)

### Paciente
- id, clinicaId, nome, cpf, telefone (WhatsApp), dataNascimento, contatoEmergencia

### Agendamento
- id, clinicaId, pacienteId, profissionalId, procedimentoId, dataHoraInicio,
  dataHoraFim, status (pendente|confirmado|cancelado|realizado|faltou),
  origem (painel|whatsapp-bot|link-publico)

### Procedimento
- id, clinicaId, nome, duracaoPadraoMinutos, valor

### Prontuario
- id, clinicaId, pacienteId, criadoEm
- Evolucoes[]: registros de atendimento (data, profissionalId, descrição,
  procedimentoId)

### Anamnese
- id, prontuarioId, respostas (estruturado: histórico médico, alergias,
  medicações em uso, condições preexistentes), preenchidoEm, preenchidoPor

### Receita
- id, prontuarioId, profissionalId, itens (medicamento, dosagem, posologia),
  emitidaEm, assinaturaDigitalId (nullable — v2)

### Odontograma (v2)
- id, prontuarioId, dentes[] (numeração, faces, condição/procedimento por face)

### Periograma (v2)
- id, prontuarioId, medicoes[] (dente, face, profundidade de sondagem,
  sangramento, mobilidade)

### ClinicWhatsappAccount
- id, clinicaId, wabaId, phoneNumberId, accessToken (criptografado),
  status (pendente|conectado|desconectado), conectadoEm

### ConversaBot
- id, clinicaId, telefonePaciente, etapaAtual (enum da máquina de estados),
  contexto (json), status (bot-ativo|aguardando-humano|encerrada), atualizadoEm

### UsuarioPlataforma
- id, nome, email, papel (`super-admin`) — usuário do dono/desenvolvedor da
  Dentyvo, sem vínculo com nenhuma `Clinica`. Não confundir com `Profissional`
  (que é usuário dentro de uma clínica/tenant).

### Assinatura
- id, clinicaId, planoId, status (`trialing`|`ativa`|`inadimplente`|`cancelada`),
  gatewayAssinaturaId (id da assinatura no gateway de pagamento),
  dataInicio, dataProximaCobranca, dataCanceladaEm

### Plano
- id, nome (ex: "Básico", "Pro"), valorMensal, limitesDeUso (ex: nº de
  profissionais, nº de mensagens do bot/mês — a definir conforme precificação)

### Cobranca
- id, assinaturaId, gatewayCobrancaId, valor, metodo (`pix`|`boleto`|`cartao`),
  status (`pendente`|`paga`|`vencida`|`estornada`), vencimento, pagaEm

## Regras de negócio centrais (candidatas a teste de domínio)

- Um agendamento não pode sobrepor outro do mesmo profissional na mesma clínica.
- Um paciente só pertence a uma clínica por registro (não há paciente
  compartilhado entre tenants).
- Uma `ClinicWhatsappAccount` só pode estar `conectado` se tiver token válido;
  token expirado força status para `desconectado` e bloqueia envio.
- Uma `ConversaBot` em status `aguardando-humano` não deve receber resposta
  automática do bot até um atendente humano encerrar ou devolver ao bot.
- Anamnese só pode ser preenchida/editada por usuário vinculado à clínica dona
  do prontuário (checagem de tenant obrigatória).
- Uma `Clinica` com `Assinatura` em status diferente de `trialing`/`ativa`
  perde acesso às funcionalidades operacionais (agendamento, prontuário, bot),
  mas mantém acesso de leitura/exportação dos próprios dados (nunca bloquear
  dado clínico de forma irrecuperável por inadimplência).
- `UsuarioPlataforma` (super-admin) nunca é escopado por `clinicaId` — é o único
  papel do sistema com acesso cross-tenant, e todo acesso dele a dado de clínica
  também passa por `AuditoriaLogPort` (ver spec 003), por ser dado sensível.
