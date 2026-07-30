/**
 * Teste de integração manual (FORA do Vitest).
 *
 * Exercita o fluxo de negócio completo chamando os casos de uso reais através
 * dos composition roots já existentes (`create-*-module.ts`), contra o banco
 * real definido em `DATABASE_URL` (`.env.local` — mesmo Neon usado pelo app
 * em dev, via pooler).
 *
 * Fluxo:
 *   1. cadastrarClinicaComTrial   — delivery: CriarClinicaComAdmin + IniciarTrial
 *   2. ConvidarUsuario             — convida usuário (papel recepcao)
 *   3. AceitarConvite              — usuário convidado aceita o convite
 *   4. CriarPaciente               — cadastra paciente de teste
 *   5. DefinirDisponibilidadeProfissional — janela do admin/dentista do passo 1
 *   6. MarcarConsulta              — marca consulta do paciente
 *   7. CriarProntuario             — cria prontuário do paciente
 *   8. PreencherAnamnese           — preenche anamnese inicial
 *   9. RegistrarEvolucao           — registra evolução de atendimento
 *  10. EmitirReceita               — emite receita com 1 item para o paciente
 *  11. GerarPdfReceita             — gera o PDF da receita emitida
 *  12. RBAC negado — recepcao não pode EmitirReceita
 *  13. IniciarTrial                — confirma Assinatura trialing (já criada no passo 1)
 *  14. VerificarAcessoAtivo        — confirma permitido=true, motivo=trialing
 *  15. RBAC plataforma negado — admin de clínica não pode ConcederAcessoManual
 *  16. RegistrarEventosOdontograma — eventos de face (permanente + decíduo)
 *  17. ConsultarOdontogramaVigente — projeção vigente reflete o passo 16
 *  18. Dente ausente — face em dente ausente_extraido (histórico) é rejeitada
 *  19. RegistrarPeriograma — exame_inicial com furca Hamp e recessão
 *  20. Furca em não-molar — FurcaNaoAplicavelAoDenteError
 *  21. ListarPeriogramasDoProntuario — ordenação registradoEm descendente
 *  22. RBAC negado — recepcao não registra odontograma nem periograma
 *  23. Dente duplicado — DenteDuplicadoNoPeriogramaError no domínio
 *
 * (Passo extra 4.1 — CriarProcedimento: não pedido explicitamente, mas é
 * pré-requisito obrigatório de `MarcarConsulta`, que exige `procedimentoId`.)
 * (Passo extra 9.1 — ConsultarProntuario: confirma que a leitura gera uma
 * nova entrada de auditoria com `acao = "leitura"` no banco.)
 * (Passo extra 9.2 — RBAC negado: confirma que `recepcao` NÃO pode
 * `CriarProntuario`; espera `PermissaoNegadaError`.)
 * (Passo extra 9.3 — Isolamento de tenant: confirma que uma segunda clínica
 * não consegue enxergar o prontuário da primeira via `ConsultarProntuario`.)
 * (Passo extra 9.4 — AlterarPapelMembro: promove profissionalAdmin a
 * dentista com CRO, pré-requisito de EmitirReceita — a matriz RBAC de
 * `receituario` só permite papel "dentista", CRO sozinho não basta.)
 *
 * Uso:
 *   npm run teste:integracao
 *   (equivalente a `npx tsx scripts/teste-integracao-manual.mjs`)
 *
 * Importante:
 * - NÃO é um teste automatizado — é um script manual para inspecionar o
 *   resultado depois no Neon.
 * - NÃO apaga nenhum dado ao final. Cada execução gera clínica, e-mails e CPF
 *   novos (sufixo por timestamp) para não colidir com execuções anteriores.
 * - Se qualquer passo falhar, o script para imediatamente e imprime o erro
 *   completo (stack incluída) — não continua silenciosamente.
 */

import { config } from "dotenv";

config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  console.error(
    "[erro] DATABASE_URL não definida em .env.local — abortando antes de conectar.",
  );
  process.exit(1);
}

const SEPARADOR = "=".repeat(72);
const TIMEZONE = "America/Sao_Paulo";

function logPasso(numero, titulo) {
  console.log(`\n${SEPARADOR}`);
  console.log(`PASSO ${numero}: ${titulo}`);
  console.log(SEPARADOR);
}

function formatarValor(valor) {
  if (valor instanceof Date) return valor.toISOString();
  if (typeof valor === "object" && valor !== null) return JSON.stringify(valor);
  return String(valor);
}

function logResumo(resumo) {
  for (const [chave, valor] of Object.entries(resumo)) {
    console.log(`  ${chave}: ${formatarValor(valor)}`);
  }
}

/** Gera um CPF sintético válido (dígitos verificadores corretos), único por execução. */
function gerarCpfValido() {
  let base;
  do {
    base = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  } while (base.every((digito) => digito === base[0]));

  const d1 = calcularDigitoVerificadorCpf(base, 10);
  const d2 = calcularDigitoVerificadorCpf([...base, d1], 11);
  return [...base, d1, d2].join("");
}

function calcularDigitoVerificadorCpf(digitos, fatorInicial) {
  let soma = 0;
  for (let i = 0; i < digitos.length; i++) {
    soma += digitos[i] * (fatorInicial - i);
  }
  const resto = (soma * 10) % 11;
  return resto === 10 ? 0 : resto;
}

/** Dia da semana (0=domingo…6=sábado) no timezone operacional da clínica. */
function diaDaSemanaEmSaoPaulo(date) {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    weekday: "short",
  }).format(date);
  const mapa = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return mapa[weekday];
}

/** Componentes ano/mês/dia da data no timezone operacional da clínica. */
function partesDataEmSaoPaulo(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  return {
    ano: parts.find((p) => p.type === "year").value,
    mes: parts.find((p) => p.type === "month").value,
    dia: parts.find((p) => p.type === "day").value,
  };
}

async function main() {
  console.log(SEPARADOR);
  console.log("TESTE DE INTEGRAÇÃO MANUAL — fluxo completo Dentyvo");
  console.log(`Banco alvo: DATABASE_URL (${mascarar(process.env.DATABASE_URL)})`);
  console.log(SEPARADOR);

  // Importado dinamicamente DEPOIS do dotenv.config(), pois `@/db` lê
  // `process.env.DATABASE_URL` no momento do import.
  const { createAuthModule } = await import(
    "@/core/auth/infra/create-auth-module"
  );
  const { CriarClinicaComAdmin } = await import(
    "@/core/auth/application/use-cases/CriarClinicaComAdmin"
  );
  const { cadastrarClinicaComTrial } = await import(
    "@/actions/cadastrar-clinica-com-trial"
  );
  const { ConvidarUsuario } = await import(
    "@/core/auth/application/use-cases/ConvidarUsuario"
  );
  const { AceitarConvite } = await import(
    "@/core/auth/application/use-cases/AceitarConvite"
  );

  const { createPacienteModule } = await import(
    "@/core/paciente/infra/create-paciente-module"
  );
  const { CriarPaciente } = await import(
    "@/core/paciente/application/use-cases/CriarPaciente"
  );

  const { createAgendamentoModule } = await import(
    "@/core/agendamento/infra/create-agendamento-module"
  );
  const { CriarProcedimento } = await import(
    "@/core/agendamento/application/use-cases/CriarProcedimento"
  );
  const { DefinirDisponibilidadeProfissional } = await import(
    "@/core/agendamento/application/use-cases/DefinirDisponibilidadeProfissional"
  );
  const { MarcarConsulta } = await import(
    "@/core/agendamento/application/use-cases/MarcarConsulta"
  );

  const { createProntuarioModule } = await import(
    "@/core/prontuario/infra/create-prontuario-module"
  );
  const { CriarProntuario } = await import(
    "@/core/prontuario/application/use-cases/CriarProntuario"
  );
  const { RegistrarEvolucao } = await import(
    "@/core/prontuario/application/use-cases/RegistrarEvolucao"
  );
  const { ConsultarProntuario } = await import(
    "@/core/prontuario/application/use-cases/ConsultarProntuario"
  );
  const { ProntuarioNaoEncontradoError } = await import(
    "@/core/prontuario/domain/errors"
  );

  const { PermissaoNegadaError, TenantMismatchError } = await import(
    "@/core/shared/errors"
  );

  const { createAnamneseModule } = await import(
    "@/core/anamnese/infra/create-anamnese-module"
  );
  const { PreencherAnamnese } = await import(
    "@/core/anamnese/application/use-cases/PreencherAnamnese"
  );

  const { AlterarPapelMembro } = await import(
    "@/core/auth/application/use-cases/AlterarPapelMembro"
  );

  const { createReceituarioModule } = await import(
    "@/core/receituario/infra/create-receituario-module"
  );

  const { createOdontogramaModule } = await import(
    "@/core/odontograma/infra/create-odontograma-module"
  );
  const { DenteAusenteSemFacesError } = await import(
    "@/core/odontograma/domain/errors"
  );

  const { createPeriogramaModule } = await import(
    "@/core/periograma/infra/create-periograma-module"
  );
  const {
    DenteDuplicadoNoPeriogramaError,
    FurcaNaoAplicavelAoDenteError,
  } = await import("@/core/periograma/domain/errors");

  // `createAssinaturaModule` exige config do gateway Asaas, mas os passos
  // usados aqui (IniciarTrial/VerificarAcessoAtivo/ConcederAcessoManual) não
  // fazem nenhuma chamada de rede — só `CriarAssinatura`/webhook usariam o
  // gateway de fato. Placeholder evita depender de ASAAS_API_KEY real só
  // para este teste manual.
  const { createAssinaturaModule } = await import(
    "@/core/assinatura/infra/create-assinatura-module"
  );
  const { UsuarioPlataformaNaoEncontradoError } = await import(
    "@/core/admin-plataforma/domain/errors"
  );

  const authModule = createAuthModule();
  const pacienteModule = createPacienteModule();
  const agendamentoModule = createAgendamentoModule();
  const prontuarioModule = createProntuarioModule();
  const anamneseModule = createAnamneseModule();
  const receituarioModule = createReceituarioModule();
  const odontogramaModule = createOdontogramaModule();
  const periogramaModule = createPeriogramaModule();
  const assinaturaModule = createAssinaturaModule({
    asaasApiKey: "manual-test-placeholder",
    asaasWebhookToken: "manual-test-placeholder",
  });

  const criarClinicaComAdmin = new CriarClinicaComAdmin(
    authModule.clinicaRepo,
    authModule.profissionalRepo,
    authModule.authPort,
  );
  const alterarPapelMembro = new AlterarPapelMembro(
    authModule.profissionalRepo,
    authModule.authPort,
  );
  const convidarUsuario = new ConvidarUsuario(
    authModule.conviteRepo,
    authModule.profissionalRepo,
    authModule.clinicaRepo,
    authModule.authPort,
    authModule.email,
  );
  const aceitarConvite = new AceitarConvite(
    authModule.conviteRepo,
    authModule.profissionalRepo,
    authModule.authPort,
  );

  const criarPaciente = new CriarPaciente(
    pacienteModule.pacienteRepo,
    pacienteModule.profissionalRepo,
  );

  const criarProcedimento = new CriarProcedimento(
    agendamentoModule.procedimentoRepo,
    agendamentoModule.profissionalRepo,
  );
  const definirDisponibilidadeProfissional =
    new DefinirDisponibilidadeProfissional(
      agendamentoModule.disponibilidadeRepo,
      agendamentoModule.profissionalRepo,
    );
  const marcarConsulta = new MarcarConsulta(
    agendamentoModule.agendamentoRepo,
    agendamentoModule.disponibilidadeRepo,
    agendamentoModule.procedimentoRepo,
    agendamentoModule.pacienteRepo,
    agendamentoModule.profissionalRepo,
    agendamentoModule.lembrete,
  );

  const criarProntuario = new CriarProntuario(
    prontuarioModule.prontuarioRepo,
    prontuarioModule.pacienteRepo,
    prontuarioModule.profissionalRepo,
    prontuarioModule.auditoria,
  );
  const registrarEvolucao = new RegistrarEvolucao(
    prontuarioModule.evolucaoRepo,
    prontuarioModule.prontuarioRepo,
    prontuarioModule.profissionalRepo,
    prontuarioModule.auditoria,
  );
  const consultarProntuario = new ConsultarProntuario(
    prontuarioModule.prontuarioRepo,
    prontuarioModule.profissionalRepo,
    prontuarioModule.auditoria,
  );

  const preencherAnamnese = new PreencherAnamnese(
    anamneseModule.anamneseRepo,
    anamneseModule.prontuarioRepo,
    anamneseModule.profissionalRepo,
    anamneseModule.auditoria,
  );

  // Dados sintéticos únicos por execução (evita colisão com execuções
  // anteriores que permanecem no banco — nada é apagado ao final).
  const agora = Date.now();
  const emailAdmin = `admin.teste.${agora}@dentyvo-teste.local`;
  const emailRecepcao = `recepcao.teste.${agora}@dentyvo-teste.local`;
  const cpfClinica = gerarCpfValido();
  const cpfPaciente = gerarCpfValido();

  // ---------------------------------------------------------------------
  // PASSO 1 — Delivery: CriarClinicaComAdmin + IniciarTrial (orquestração)
  // ---------------------------------------------------------------------
  logPasso(
    1,
    "cadastrarClinicaComTrial — cria clínica + dispara IniciarTrial (delivery)",
  );
  const clinica = await cadastrarClinicaComTrial(
    {
      criarClinicaComAdmin,
      iniciarTrial: assinaturaModule.iniciarTrial,
    },
    {
      clinica: {
        nome: `Clínica Teste ${agora}`,
        endereco: "Rua de Teste, 123 - São Paulo/SP",
        tipoDocumento: "cpf",
        documento: cpfClinica,
      },
      admin: {
        nome: "Admin Teste",
        email: emailAdmin,
        senha: "SenhaForte!123",
      },
    },
  );
  logResumo({
    clinicaId: clinica.id,
    nome: clinica.nome,
    documento: cpfClinica,
    status: clinica.status,
    emailAdmin,
  });

  const usuarioAdmin =
    await authModule.authPort.buscarUsuarioPorEmail(emailAdmin);
  if (!usuarioAdmin) {
    throw new Error("Usuário admin não encontrado após CriarClinicaComAdmin.");
  }
  const profissionalAdmin = await authModule.profissionalRepo.buscarPorUsuarioId(
    usuarioAdmin.id,
  );
  if (!profissionalAdmin) {
    throw new Error(
      "Profissional admin não encontrado após CriarClinicaComAdmin.",
    );
  }
  logResumo({
    usuarioAdminId: usuarioAdmin.id,
    profissionalAdminId: profissionalAdmin.id,
    papelAdmin: profissionalAdmin.papel,
  });

  // ---------------------------------------------------------------------
  // PASSO 2 — ConvidarUsuario
  // ---------------------------------------------------------------------
  logPasso(2, "ConvidarUsuario — convida um segundo usuário (papel recepcao)");
  const convite = await convidarUsuario.executar({
    clinicaId: clinica.id,
    email: emailRecepcao,
    papel: "recepcao",
    convidadoPorUsuarioId: usuarioAdmin.id,
  });
  logResumo({
    conviteId: convite.id,
    email: convite.email,
    papel: convite.papel,
    token: convite.token,
    expiresAt: convite.expiresAt,
  });

  // ---------------------------------------------------------------------
  // PASSO 3 — AceitarConvite
  // ---------------------------------------------------------------------
  logPasso(3, "AceitarConvite — simula o usuário convidado aceitando o convite");
  const profissionalRecepcao = await aceitarConvite.executar({
    token: convite.token,
    nome: "Recepção Teste",
    senha: "SenhaForte!123",
  });
  logResumo({
    profissionalId: profissionalRecepcao.id,
    usuarioId: profissionalRecepcao.usuarioId,
    papel: profissionalRecepcao.papel,
    clinicaId: profissionalRecepcao.clinicaId,
  });

  // ---------------------------------------------------------------------
  // PASSO 4 — CriarPaciente (executado pelo usuário recepcao recém-aceito)
  // ---------------------------------------------------------------------
  logPasso(4, "CriarPaciente — cadastra um paciente de teste");
  const paciente = await criarPaciente.executar({
    clinicaId: clinica.id,
    solicitadoPorUsuarioId: profissionalRecepcao.usuarioId,
    nome: "Paciente Teste",
    cpf: cpfPaciente,
    telefone: "11999998888",
    dataNascimento: new Date("1990-05-20T00:00:00-03:00"),
    contatoEmergencia: "11988887777",
  });
  logResumo({
    pacienteId: paciente.id,
    nome: paciente.nome,
    cpf: cpfPaciente,
    telefone: paciente.telefone,
    dataNascimento: paciente.dataNascimento,
  });

  // ---------------------------------------------------------------------
  // PASSO 4.1 — CriarProcedimento (pré-requisito não pedido explicitamente,
  // mas MarcarConsulta exige `procedimentoId` de um procedimento existente).
  // ---------------------------------------------------------------------
  logPasso(
    "4.1",
    "CriarProcedimento — pré-requisito de MarcarConsulta (não pedido, mas obrigatório)",
  );
  const procedimento = await criarProcedimento.executar({
    clinicaId: clinica.id,
    solicitadoPorUsuarioId: usuarioAdmin.id,
    nome: "Consulta de avaliação",
    duracaoPadraoMinutos: 30,
    valor: 150,
  });
  logResumo({
    procedimentoId: procedimento.id,
    nome: procedimento.nome,
    duracaoPadraoMinutos: procedimento.duracaoPadraoMinutos,
    valor: procedimento.valor,
  });

  // ---------------------------------------------------------------------
  // PASSO 5 — DefinirDisponibilidadeProfissional
  // ---------------------------------------------------------------------
  logPasso(
    5,
    "DefinirDisponibilidadeProfissional — janela do admin/dentista do passo 1",
  );
  const diaDaSemana = diaDaSemanaEmSaoPaulo(new Date());
  const janelas = await definirDisponibilidadeProfissional.executar({
    clinicaId: clinica.id,
    solicitadoPorUsuarioId: usuarioAdmin.id,
    profissionalId: profissionalAdmin.id,
    janelas: [{ diaDaSemana, horaInicio: "08:00", horaFim: "18:00" }],
  });
  logResumo({
    quantidadeJanelas: janelas.length,
    diaDaSemana,
    horaInicio: janelas[0].horaInicio,
    horaFim: janelas[0].horaFim,
  });

  // ---------------------------------------------------------------------
  // PASSO 6 — MarcarConsulta (executado pelo usuário recepcao)
  // ---------------------------------------------------------------------
  logPasso(6, "MarcarConsulta — marca uma consulta para o paciente");
  // +7 dias garante o MESMO dia da semana da janela definida acima e uma
  // data no futuro (evita cair fora da disponibilidade ou no passado).
  const dataBase = new Date(agora + 7 * 24 * 60 * 60 * 1000);
  const { ano, mes, dia } = partesDataEmSaoPaulo(dataBase);
  const dataHoraInicio = new Date(`${ano}-${mes}-${dia}T10:00:00-03:00`);
  const agendamento = await marcarConsulta.executar({
    clinicaId: clinica.id,
    solicitadoPorUsuarioId: profissionalRecepcao.usuarioId,
    pacienteId: paciente.id,
    profissionalId: profissionalAdmin.id,
    procedimentoId: procedimento.id,
    dataHoraInicio,
    origem: "painel",
  });
  logResumo({
    agendamentoId: agendamento.id,
    status: agendamento.status,
    dataHoraInicio: agendamento.dataHoraInicio,
    dataHoraFim: agendamento.dataHoraFim,
    origem: agendamento.origem,
  });

  // ---------------------------------------------------------------------
  // PASSO 7 — CriarProntuario
  // ---------------------------------------------------------------------
  logPasso(7, "CriarProntuario — cria o prontuário do paciente");
  const prontuario = await criarProntuario.executar({
    clinicaId: clinica.id,
    solicitadoPorUsuarioId: usuarioAdmin.id,
    pacienteId: paciente.id,
  });
  logResumo({
    prontuarioId: prontuario.id,
    pacienteId: prontuario.pacienteId,
    criadoEm: prontuario.criadoEm,
  });

  // ---------------------------------------------------------------------
  // PASSO 8 — PreencherAnamnese
  // ---------------------------------------------------------------------
  logPasso(8, "PreencherAnamnese — preenche a anamnese inicial");
  const anamnese = await preencherAnamnese.executar({
    clinicaId: clinica.id,
    solicitadoPorUsuarioId: usuarioAdmin.id,
    prontuarioId: prontuario.id,
    respostas: {
      historicoMedico: { texto: "Hipertensão controlada.", negado: false },
      alergias: { texto: null, negado: true },
      medicacoesEmUso: { texto: "Losartana 50mg, 1x ao dia.", negado: false },
      condicoesPreexistentes: { texto: null, negado: true },
    },
  });
  logResumo({
    anamneseId: anamnese.id,
    versao: anamnese.versao,
    prontuarioId: anamnese.prontuarioId,
    preenchidoPorProfissionalId: anamnese.preenchidoPorProfissionalId,
  });

  // ---------------------------------------------------------------------
  // PASSO 9 — RegistrarEvolucao
  // ---------------------------------------------------------------------
  logPasso(9, "RegistrarEvolucao — registra uma evolução de atendimento");
  const evolucao = await registrarEvolucao.executar({
    clinicaId: clinica.id,
    solicitadoPorUsuarioId: usuarioAdmin.id,
    prontuarioId: prontuario.id,
    descricao: "Consulta de avaliação inicial realizada sem intercorrências.",
    procedimentoId: procedimento.id,
  });
  logResumo({
    evolucaoId: evolucao.id,
    tipo: evolucao.tipo,
    registradoEm: evolucao.registradoEm,
    profissionalId: evolucao.profissionalId,
  });

  // ---------------------------------------------------------------------
  // PASSO 9.1 — ConsultarProntuario (solicitante: admin/profissional do
  // passo 1) + confirmação de que gerou auditoria de leitura no banco.
  // ---------------------------------------------------------------------
  logPasso(
    "9.1",
    "ConsultarProntuario — consulta o prontuário como o admin do passo 1 e confirma auditoria de leitura",
  );
  // `ConsultarProntuarioInput.solicitadoPorUsuarioId` espera o id de usuário
  // (BetterAuth), o mesmo usado em todos os passos anteriores para
  // identificar o `profissionalAdmin` — não o `profissionalId` diretamente.
  const antesDaConsulta = new Date();
  const prontuarioConsultado = await consultarProntuario.executar({
    clinicaId: clinica.id,
    solicitadoPorUsuarioId: usuarioAdmin.id,
    prontuarioId: prontuario.id,
  });
  logResumo({
    prontuarioId: prontuarioConsultado.id,
    pacienteId: prontuarioConsultado.pacienteId,
    criadoEm: prontuarioConsultado.criadoEm,
    solicitanteUsuarioId: usuarioAdmin.id,
    solicitanteProfissionalId: profissionalAdmin.id,
  });

  // Confirma no banco (fora do port, só para inspeção do teste manual) que
  // `ConsultarProntuario` gravou uma nova entrada de auditoria de leitura.
  const { db } = await import("@/db");
  const { auditoriaLog } = await import("@/db/schema");
  const { and, desc, eq } = await import("drizzle-orm");

  const entradasAuditoriaLeitura = await db.query.auditoriaLog.findMany({
    where: and(
      eq(auditoriaLog.recursoTipo, "prontuario"),
      eq(auditoriaLog.recursoId, prontuario.id),
      eq(auditoriaLog.acao, "leitura"),
    ),
    orderBy: [desc(auditoriaLog.ocorridoEm)],
  });
  const novaAuditoriaLeitura = entradasAuditoriaLeitura.find(
    (linha) => linha.ocorridoEm.getTime() >= antesDaConsulta.getTime(),
  );
  if (!novaAuditoriaLeitura) {
    throw new Error(
      `ConsultarProntuario não gerou nova entrada de auditoria com acao="leitura" ` +
        `para o prontuário ${prontuario.id} (encontradas ${entradasAuditoriaLeitura.length} entrada(s) anterior(es)).`,
    );
  }
  console.log("  Confirmado: nova entrada de auditoria de leitura no banco.");
  logResumo({
    auditoriaId: novaAuditoriaLeitura.id,
    acao: novaAuditoriaLeitura.acao,
    recursoTipo: novaAuditoriaLeitura.recursoTipo,
    recursoId: novaAuditoriaLeitura.recursoId,
    atorUsuarioId: novaAuditoriaLeitura.atorUsuarioId,
    atorProfissionalId: novaAuditoriaLeitura.atorProfissionalId,
    pacienteId: novaAuditoriaLeitura.pacienteId,
    ocorridoEm: novaAuditoriaLeitura.ocorridoEm,
  });

  // ---------------------------------------------------------------------
  // PASSO 9.2 — RBAC negado: `recepcao` não pode CriarProntuario.
  // ---------------------------------------------------------------------
  logPasso(
    "9.2",
    "RBAC negado — CriarProntuario com solicitante papel recepcao deve ser barrado",
  );
  let recepcaoConseguiuCriarProntuario = false;
  try {
    await criarProntuario.executar({
      clinicaId: clinica.id,
      solicitadoPorUsuarioId: profissionalRecepcao.usuarioId,
      pacienteId: paciente.id,
    });
    // Se chegou aqui, o RBAC NÃO barrou — falha de segurança.
    recepcaoConseguiuCriarProntuario = true;
  } catch (erro) {
    if (!(erro instanceof PermissaoNegadaError)) {
      // Erro inesperado (não é o RBAC funcionando) — propaga para o
      // handler global, que imprime a stack completa e interrompe o script.
      throw erro;
    }
    logResumo({
      excecaoRecebida: erro.nome,
      mensagem: erro.message,
      papelSolicitante: profissionalRecepcao.papel,
    });
    console.log("RBAC OK: recepcao negado corretamente");
  }

  if (recepcaoConseguiuCriarProntuario) {
    console.error("FALHA DE SEGURANÇA: recepcao conseguiu criar prontuário");
    process.exit(1);
  }

  // ---------------------------------------------------------------------
  // PASSO 9.3 — Isolamento de tenant: segunda clínica não pode enxergar o
  // prontuário da primeira via ConsultarProntuario.
  // ---------------------------------------------------------------------
  logPasso(
    "9.3",
    "Isolamento de tenant — segunda clínica não pode consultar prontuário da primeira",
  );

  const emailAdmin2 = `admin2.teste.${agora}@dentyvo-teste.local`;
  const cpfClinica2 = gerarCpfValido();
  const clinica2 = await criarClinicaComAdmin.executar({
    clinica: {
      nome: `Clínica Teste B ${agora}`,
      endereco: "Av. Isolamento, 456 - Rio de Janeiro/RJ",
      tipoDocumento: "cpf",
      documento: cpfClinica2,
    },
    admin: {
      nome: "Admin Teste B",
      email: emailAdmin2,
      senha: "SenhaForte!123",
    },
  });
  const usuarioAdmin2 =
    await authModule.authPort.buscarUsuarioPorEmail(emailAdmin2);
  if (!usuarioAdmin2) {
    throw new Error("Usuário admin da segunda clínica não encontrado.");
  }
  const profissionalAdmin2 = await authModule.profissionalRepo.buscarPorUsuarioId(
    usuarioAdmin2.id,
  );
  if (!profissionalAdmin2) {
    throw new Error("Profissional admin da segunda clínica não encontrado.");
  }
  logResumo({
    clinicaSegundaId: clinica2.id,
    nome: clinica2.nome,
    usuarioAdmin2Id: usuarioAdmin2.id,
    profissionalAdmin2Id: profissionalAdmin2.id,
  });

  let vazouDadoEntreClinicas = false;
  try {
    // Contexto de tenant do solicitante é o da SEGUNDA clínica (como viria
    // da sessão dele), mas o `prontuarioId` pertence à PRIMEIRA clínica.
    const prontuarioCruzado = await consultarProntuario.executar({
      clinicaId: clinica2.id,
      solicitadoPorUsuarioId: usuarioAdmin2.id,
      prontuarioId: prontuario.id,
    });
    // Se não lançou, o repositório vazou um prontuário de outra clínica.
    vazouDadoEntreClinicas = true;
    console.error("FALHA DE ISOLAMENTO: vazou dado entre clínicas");
    console.error(
      `  prontuário retornado indevidamente: ${JSON.stringify({
        prontuarioId: prontuarioCruzado.id,
        clinicaIdRetornado: prontuarioCruzado.clinicaId,
        clinicaIdEsperadoDoSolicitante: clinica2.id,
        clinicaIdRealDoProntuario: clinica.id,
      })}`,
    );
  } catch (erro) {
    if (
      !(erro instanceof ProntuarioNaoEncontradoError) &&
      !(erro instanceof TenantMismatchError)
    ) {
      // Erro inesperado (não é o isolamento funcionando) — propaga.
      throw erro;
    }
    logResumo({
      excecaoRecebida: erro.nome,
      mensagem: erro.message,
    });
    console.log("ISOLAMENTO OK");
  }

  if (vazouDadoEntreClinicas) {
    process.exit(1);
  }

  // ---------------------------------------------------------------------
  // PASSO 9.4 — AlterarPapelMembro (pré-requisito não pedido explicitamente).
  //
  // A matriz RBAC de `receituario` (`emitir_receita: ["dentista"]`) só
  // permite o papel "dentista" — CRO presente não é suficiente, e `admin`
  // é sempre barrado ANTES da checagem de CRO. Para reaproveitar o mesmo
  // `profissionalAdminId` do passo 1 no passo 10 (como pedido), é preciso
  // promovê-lo a "dentista" e atribuir um CRO válido primeiro.
  // ---------------------------------------------------------------------
  logPasso(
    "9.4",
    "AlterarPapelMembro — promove profissionalAdmin a dentista com CRO (pré-requisito de EmitirReceita)",
  );
  const croProfissionalAdmin = "12345-SP";
  const profissionalAdminDentista = await alterarPapelMembro.executar({
    clinicaId: clinica.id,
    profissionalId: profissionalAdmin.id,
    novoPapel: "dentista",
    solicitadoPorUsuarioId: usuarioAdmin.id,
    cro: croProfissionalAdmin,
  });
  logResumo({
    profissionalId: profissionalAdminDentista.id,
    papelAnterior: "admin",
    papelAtual: profissionalAdminDentista.papel,
    cro: profissionalAdminDentista.cro,
  });

  // ---------------------------------------------------------------------
  // PASSO 10 — EmitirReceita (solicitante: profissionalAdminId, agora
  // dentista com CRO válido) para o paciente/prontuário já criados.
  // ---------------------------------------------------------------------
  logPasso(
    10,
    "EmitirReceita — emite receita com 1 item para o paciente (solicitante: profissionalAdminId)",
  );
  const receita = await receituarioModule.emitirReceita.executar({
    clinicaId: clinica.id,
    solicitadoPorUsuarioId: usuarioAdmin.id,
    prontuarioId: prontuario.id,
    itens: [
      {
        medicamento: "Amoxicilina",
        dosagem: "500 mg",
        posologia: "1 comprimido de 8/8h",
        duracao: "7 dias",
      },
    ],
  });
  logResumo({
    receitaId: receita.id,
    prontuarioId: receita.prontuarioId,
    profissionalId: receita.profissionalId,
    quantidadeItens: receita.itens.length,
    emitidaEm: receita.emitidaEm,
  });

  // ---------------------------------------------------------------------
  // PASSO 11 — GerarPdfReceita: confirma bytes não vazios (sem imprimir
  // conteúdo, só o tamanho).
  // ---------------------------------------------------------------------
  logPasso(11, "GerarPdfReceita — gera o PDF da receita emitida");
  const pdfReceita = await receituarioModule.gerarPdfReceita.executar({
    clinicaId: clinica.id,
    solicitadoPorUsuarioId: usuarioAdmin.id,
    receitaId: receita.id,
  });
  if (!(pdfReceita.bytes instanceof Uint8Array) || pdfReceita.bytes.length === 0) {
    throw new Error(
      `GerarPdfReceita retornou bytes vazios/ inválidos para a receita ${receita.id}.`,
    );
  }
  logResumo({
    nomeArquivo: pdfReceita.nomeArquivo,
    contentType: pdfReceita.contentType,
    tamanhoBytes: pdfReceita.bytes.length,
  });

  // ---------------------------------------------------------------------
  // PASSO 12 — RBAC negado: recepcao não pode EmitirReceita.
  // ---------------------------------------------------------------------
  logPasso(
    12,
    "RBAC negado — EmitirReceita com solicitante papel recepcao deve ser barrado",
  );
  let recepcaoConseguiuEmitirReceita = false;
  try {
    await receituarioModule.emitirReceita.executar({
      clinicaId: clinica.id,
      solicitadoPorUsuarioId: profissionalRecepcao.usuarioId,
      prontuarioId: prontuario.id,
      itens: [
        {
          medicamento: "Dipirona",
          dosagem: "1g",
          posologia: "1 comprimido de 6/6h se dor",
          duracao: "3 dias",
        },
      ],
    });
    recepcaoConseguiuEmitirReceita = true;
  } catch (erro) {
    if (!(erro instanceof PermissaoNegadaError)) {
      throw erro;
    }
    logResumo({
      excecaoRecebida: erro.nome,
      mensagem: erro.message,
      papelSolicitante: profissionalRecepcao.papel,
    });
    console.log("RBAC OK");
  }

  if (recepcaoConseguiuEmitirReceita) {
    console.error("FALHA DE SEGURANÇA: recepcao conseguiu emitir receita");
    process.exit(1);
  }

  // ---------------------------------------------------------------------
  // PASSO 13 — Confirma Assinatura em trialing criada automaticamente no
  // passo 1 pela orquestração de delivery (cadastrarClinicaComTrial).
  // ---------------------------------------------------------------------
  logPasso(
    13,
    "IniciarTrial — confirma Assinatura em trialing já criada no passo 1 (sem chamada manual)",
  );
  const assinatura = await assinaturaModule.assinaturaRepo.buscarPorClinicaId(
    clinica.id,
  );
  if (!assinatura) {
    throw new Error(
      "Esperava Assinatura trialing criada automaticamente por cadastrarClinicaComTrial no passo 1.",
    );
  }
  if (assinatura.status !== "trialing") {
    throw new Error(
      `Assinatura encontrada com status inesperado: ${assinatura.status} (esperado: trialing).`,
    );
  }
  console.log(
    "  Assinatura já existia (disparada automaticamente no passo 1).",
  );
  logResumo({
    assinaturaId: assinatura.id,
    clinicaId: assinatura.clinicaId,
    status: assinatura.status,
    dataInicio: assinatura.dataInicio,
    dataFimTrial: assinatura.dataFimTrial,
  });

  // ---------------------------------------------------------------------
  // PASSO 14 — VerificarAcessoAtivo: permitido=true, motivo="trialing".
  // ---------------------------------------------------------------------
  logPasso(
    14,
    "VerificarAcessoAtivo — confirma acesso permitido com motivo trialing",
  );
  const resultadoAcesso = await assinaturaModule.verificarAcessoAtivo.executar({
    clinicaId: clinica.id,
  });
  if (resultadoAcesso.permitido !== true || resultadoAcesso.motivo !== "trialing") {
    throw new Error(
      `VerificarAcessoAtivo retornou resultado inesperado para clínica em trial: ${JSON.stringify(resultadoAcesso)}`,
    );
  }
  logResumo(resultadoAcesso);

  // ---------------------------------------------------------------------
  // PASSO 15 — RBAC negado (plataforma): admin de clínica não pode
  // ConcederAcessoManual.
  //
  // `ConcederAcessoManualInput.solicitadoPorUsuarioPlataformaId` é resolvido
  // contra a tabela `usuario_plataforma` — completamente separada de
  // `profissional`. Por isso, passar o `profissionalAdminId` (id de um
  // `Profissional` de clínica) lança `UsuarioPlataformaNaoEncontradoError`
  // (não encontrado nesse espaço de ids) em vez de `PermissaoNegadaError`
  // — mas o resultado de segurança é o mesmo: acesso negado. Aceitamos
  // ambas as exceções como "negado corretamente".
  // Nota: `profissionalAdminId` foi promovido a "dentista" no passo 9.4;
  // o teste continua válido pois o que se valida é que um id de
  // `Profissional` (qualquer papel de clínica) nunca é um super-admin.
  // ---------------------------------------------------------------------
  logPasso(
    15,
    "RBAC plataforma negado — ConcederAcessoManual com solicitante profissionalAdminId deve ser barrado",
  );
  let profissionalConseguiuConcederAcesso = false;
  try {
    await assinaturaModule.concederAcessoManual.executar({
      solicitadoPorUsuarioPlataformaId: profissionalAdmin.id,
      clinicaId: clinica.id,
      motivo: "tentativa indevida via teste de integração manual",
      ateData: new Date(agora + 30 * 24 * 60 * 60 * 1000),
    });
    profissionalConseguiuConcederAcesso = true;
  } catch (erro) {
    if (
      !(erro instanceof PermissaoNegadaError) &&
      !(erro instanceof UsuarioPlataformaNaoEncontradoError)
    ) {
      throw erro;
    }
    logResumo({
      excecaoRecebida: erro.nome,
      mensagem: erro.message,
      idUsado: profissionalAdmin.id,
      papelAtualDoProfissional: profissionalAdminDentista.papel,
    });
    console.log("RBAC plataforma OK");
  }

  if (profissionalConseguiuConcederAcesso) {
    console.error(
      "FALHA DE SEGURANÇA: profissional de clínica conseguiu conceder acesso manual de plataforma",
    );
    process.exit(1);
  }

  // ---------------------------------------------------------------------
  // PASSO 16 — RegistrarEventosOdontograma (solicitante: dentista do passo 9.4)
  // ---------------------------------------------------------------------
  logPasso(
    16,
    "RegistrarEventosOdontograma — eventos de face (permanente + decíduo) pelo dentista",
  );
  const eventosOdontograma = await odontogramaModule.registrarEventosOdontograma.executar(
    {
      clinicaId: clinica.id,
      solicitadoPorUsuarioId: usuarioAdmin.id,
      prontuarioId: prontuario.id,
      eventos: [
        {
          numeroDente: 16,
          nivel: "face",
          face: "oclusal",
          estadoNovo: "cariado",
        },
        {
          numeroDente: 11,
          nivel: "face",
          face: "vestibular",
          estadoNovo: "restaurado",
        },
        {
          numeroDente: 54,
          nivel: "face",
          face: "mesial",
          estadoNovo: "selante",
        },
      ],
    },
  );
  logResumo({
    quantidadeEventos: eventosOdontograma.length,
    profissionalId: eventosOdontograma[0]?.profissionalId,
    dentes: eventosOdontograma.map((e) => e.numeroDente).join(", "),
    estados: eventosOdontograma.map((e) => e.estadoNovo).join(", "),
    sequencias: eventosOdontograma.map((e) => e.sequencia).join(", "),
  });

  // ---------------------------------------------------------------------
  // PASSO 17 — ConsultarOdontogramaVigente
  // ---------------------------------------------------------------------
  logPasso(
    17,
    "ConsultarOdontogramaVigente — confirma projeção vigente dos eventos do passo 16",
  );
  const odontogramaVigente =
    await odontogramaModule.consultarOdontogramaVigente.executar({
      clinicaId: clinica.id,
      solicitadoPorUsuarioId: usuarioAdmin.id,
      prontuarioId: prontuario.id,
    });
  const dentesEsperados = new Set([16, 11, 54]);
  const dentesVigentes = odontogramaVigente.dentes.filter((d) =>
    dentesEsperados.has(d.numeroDente),
  );
  if (dentesVigentes.length !== 3) {
    throw new Error(
      `Odontograma vigente não refletiu os 3 dentes do passo 16 (encontrados: ${dentesVigentes.map((d) => d.numeroDente).join(", ")}).`,
    );
  }
  const face16 = dentesVigentes
    .find((d) => d.numeroDente === 16)
    ?.faces.find((f) => f.face === "oclusal");
  const face11 = dentesVigentes
    .find((d) => d.numeroDente === 11)
    ?.faces.find((f) => f.face === "vestibular");
  const face54 = dentesVigentes
    .find((d) => d.numeroDente === 54)
    ?.faces.find((f) => f.face === "mesial");
  if (
    face16?.estado !== "cariado" ||
    face11?.estado !== "restaurado" ||
    face54?.estado !== "selante"
  ) {
    throw new Error(
      `Estados vigentes inesperados: 16/oclusal=${face16?.estado}, 11/vestibular=${face11?.estado}, 54/mesial=${face54?.estado}`,
    );
  }
  logResumo({
    prontuarioId: odontogramaVigente.prontuarioId,
    quantidadeDentesVigentes: odontogramaVigente.dentes.length,
    dente16Oclusal: face16.estado,
    dente11Vestibular: face11.estado,
    dente54Mesial: face54.estado,
  });

  // ---------------------------------------------------------------------
  // PASSO 18 — Dente ausente no histórico bloqueia face em chamada futura
  // ---------------------------------------------------------------------
  logPasso(
    18,
    "Dente ausente — ausente_extraido no histórico rejeita face em chamada separada",
  );
  const denteAusenteNumero = 26;
  await odontogramaModule.registrarEventosOdontograma.executar({
    clinicaId: clinica.id,
    solicitadoPorUsuarioId: usuarioAdmin.id,
    prontuarioId: prontuario.id,
    eventos: [
      {
        numeroDente: denteAusenteNumero,
        nivel: "dente",
        estadoNovo: "ausente_extraido",
      },
    ],
  });
  logResumo({
    denteMarcadoAusente: denteAusenteNumero,
    estado: "ausente_extraido",
  });

  let faceEmDenteAusentePassou = false;
  try {
    await odontogramaModule.registrarEventosOdontograma.executar({
      clinicaId: clinica.id,
      solicitadoPorUsuarioId: usuarioAdmin.id,
      prontuarioId: prontuario.id,
      eventos: [
        {
          numeroDente: denteAusenteNumero,
          nivel: "face",
          face: "oclusal",
          estadoNovo: "cariado",
        },
      ],
    });
    faceEmDenteAusentePassou = true;
  } catch (erro) {
    if (!(erro instanceof DenteAusenteSemFacesError)) {
      throw erro;
    }
    logResumo({
      excecaoRecebida: erro.nome,
      mensagem: erro.message,
      numeroDente: denteAusenteNumero,
    });
    console.log("REGRA DENTE AUSENTE OK");
  }
  if (faceEmDenteAusentePassou) {
    console.error(
      "FALHA: face foi aceita em dente já marcado ausente_extraido no histórico",
    );
    process.exit(1);
  }

  // ---------------------------------------------------------------------
  // PASSO 19 — RegistrarPeriograma (exame_inicial com furca Hamp + recessão)
  // ---------------------------------------------------------------------
  logPasso(
    19,
    "RegistrarPeriograma — exame_inicial com molar 16 (Hamp II), recessão e preenchimento parcial",
  );
  const periogramaInicial = await periogramaModule.registrarPeriograma.executar(
    {
      clinicaId: clinica.id,
      solicitadoPorUsuarioId: usuarioAdmin.id,
      prontuarioId: prontuario.id,
      tipo: "exame_inicial",
      dentes: [
        {
          numeroDente: 16,
          mobilidade: 1,
          implante: false,
          classificacaoFurca: { sistema: "hamp", grau: 2 },
          nota: "Furca vestibular representativa",
          pontos: [
            {
              lado: "vestibular",
              posicao: "mesial",
              margemGengival: -2,
              profundidadeSondagem: 5,
              placa: true,
              sangramentoSondagem: false,
            },
            {
              lado: "vestibular",
              posicao: "central",
              margemGengival: -1,
              profundidadeSondagem: 4,
            },
            {
              lado: "palatina_lingual",
              posicao: "distal",
              profundidadeSondagem: 3,
            },
          ],
        },
        {
          numeroDente: 11,
          mobilidade: 0,
          pontos: [],
        },
      ],
    },
  );
  logResumo({
    periogramaId: periogramaInicial.id,
    tipo: periogramaInicial.tipo,
    profissionalId: periogramaInicial.profissionalId,
    registradoEm: periogramaInicial.registradoEm,
    quantidadeDentes: periogramaInicial.dentes.length,
    dente16Furca: periogramaInicial.dentes[0]?.classificacaoFurca
      ? `${periogramaInicial.dentes[0].classificacaoFurca.sistema}:${periogramaInicial.dentes[0].classificacaoFurca.grau}`
      : null,
    dente16Pontos: periogramaInicial.dentes[0]?.pontos.length,
    margemGengivalMesial: periogramaInicial.dentes[0]?.pontos[0]?.margemGengival,
  });

  // ---------------------------------------------------------------------
  // PASSO 20 — Furca em não-molar deve ser rejeitada
  // ---------------------------------------------------------------------
  logPasso(
    20,
    "Furca inválida — classificacaoFurca em dente 11 (não-molar) deve falhar",
  );
  let furcaEmNaoMolarPassou = false;
  try {
    await periogramaModule.registrarPeriograma.executar({
      clinicaId: clinica.id,
      solicitadoPorUsuarioId: usuarioAdmin.id,
      prontuarioId: prontuario.id,
      tipo: "exame_inicial",
      dentes: [
        {
          numeroDente: 11,
          classificacaoFurca: { sistema: "hamp", grau: 1 },
        },
      ],
    });
    furcaEmNaoMolarPassou = true;
  } catch (erro) {
    if (!(erro instanceof FurcaNaoAplicavelAoDenteError)) {
      throw erro;
    }
    logResumo({
      excecaoRecebida: erro.nome,
      mensagem: erro.message,
      numeroDente: 11,
    });
    console.log("RBAC/VALIDACAO FURCA OK");
  }
  if (furcaEmNaoMolarPassou) {
    console.error("FALHA: furca aceita em dente não-molar (11)");
    process.exit(1);
  }

  // ---------------------------------------------------------------------
  // PASSO 21 — ListarPeriogramasDoProntuario (ordem descendente)
  // ---------------------------------------------------------------------
  logPasso(
    21,
    "ListarPeriogramasDoProntuario — confirma periograma do passo 19 e ordem por registradoEm desc",
  );
  // Segundo exame (reavaliacao) com instante posterior para validar
  // ordenação descendente além da presença do exame inicial.
  await new Promise((resolve) => setTimeout(resolve, 25));
  const periogramaReavaliacao =
    await periogramaModule.registrarPeriograma.executar({
      clinicaId: clinica.id,
      solicitadoPorUsuarioId: usuarioAdmin.id,
      prontuarioId: prontuario.id,
      tipo: "reavaliacao",
      dentes: [
        {
          numeroDente: 16,
          mobilidade: 2,
          classificacaoFurca: { sistema: "glickman", grau: 2 },
        },
      ],
    });
  const periogramasListados =
    await periogramaModule.listarPeriogramasDoProntuario.executar({
      clinicaId: clinica.id,
      solicitadoPorUsuarioId: usuarioAdmin.id,
      prontuarioId: prontuario.id,
    });
  if (periogramasListados.length < 2) {
    throw new Error(
      `Esperava ao menos 2 periogramas listados (encontrados: ${periogramasListados.length}).`,
    );
  }
  if (periogramasListados[0]?.id !== periogramaReavaliacao.id) {
    throw new Error(
      `Ordenação descendente falhou: esperado id ${periogramaReavaliacao.id} primeiro, veio ${periogramasListados[0]?.id}.`,
    );
  }
  if (
    !periogramasListados.some((p) => p.id === periogramaInicial.id)
  ) {
    throw new Error(
      `Listagem não retornou o periograma do passo 19 (${periogramaInicial.id}).`,
    );
  }
  for (let i = 1; i < periogramasListados.length; i++) {
    const anterior = periogramasListados[i - 1].registradoEm.getTime();
    const atual = periogramasListados[i].registradoEm.getTime();
    if (anterior < atual) {
      throw new Error(
        "Ordenação por registradoEm descendente violada na listagem de periogramas.",
      );
    }
  }
  logResumo({
    quantidade: periogramasListados.length,
    idsOrdem: periogramasListados.map((p) => p.id).join(", "),
    tiposOrdem: periogramasListados.map((p) => p.tipo).join(", "),
    primeiroId: periogramasListados[0].id,
    incluiExameInicial: true,
  });

  // ---------------------------------------------------------------------
  // PASSO 22 — RBAC negado: recepcao não registra odontograma nem periograma
  // ---------------------------------------------------------------------
  logPasso(
    22,
    "RBAC negado — recepcao não pode RegistrarPeriograma nem RegistrarEventosOdontograma",
  );
  let recepcaoConseguiuRegistrarPeriograma = false;
  try {
    await periogramaModule.registrarPeriograma.executar({
      clinicaId: clinica.id,
      solicitadoPorUsuarioId: profissionalRecepcao.usuarioId,
      prontuarioId: prontuario.id,
      tipo: "exame_inicial",
      dentes: [{ numeroDente: 36, mobilidade: 0 }],
    });
    recepcaoConseguiuRegistrarPeriograma = true;
  } catch (erro) {
    if (!(erro instanceof PermissaoNegadaError)) {
      throw erro;
    }
    logResumo({
      acao: "RegistrarPeriograma",
      excecaoRecebida: erro.nome,
      papelSolicitante: profissionalRecepcao.papel,
    });
  }

  let recepcaoConseguiuRegistrarOdontograma = false;
  try {
    await odontogramaModule.registrarEventosOdontograma.executar({
      clinicaId: clinica.id,
      solicitadoPorUsuarioId: profissionalRecepcao.usuarioId,
      prontuarioId: prontuario.id,
      eventos: [
        {
          numeroDente: 21,
          nivel: "face",
          face: "distal",
          estadoNovo: "higido",
        },
      ],
    });
    recepcaoConseguiuRegistrarOdontograma = true;
  } catch (erro) {
    if (!(erro instanceof PermissaoNegadaError)) {
      throw erro;
    }
    logResumo({
      acao: "RegistrarEventosOdontograma",
      excecaoRecebida: erro.nome,
      papelSolicitante: profissionalRecepcao.papel,
    });
  }

  if (
    recepcaoConseguiuRegistrarPeriograma ||
    recepcaoConseguiuRegistrarOdontograma
  ) {
    console.error(
      "FALHA DE SEGURANÇA: recepcao conseguiu registrar periograma e/ou odontograma",
    );
    process.exit(1);
  }
  console.log("RBAC OK");

  // ---------------------------------------------------------------------
  // PASSO 23 — Dente duplicado rejeitado no domínio (não constraint crua)
  // ---------------------------------------------------------------------
  logPasso(
    23,
    "Dente duplicado — mesmo numeroDente duas vezes deve lançar DenteDuplicadoNoPeriogramaError",
  );
  let denteDuplicadoPassou = false;
  try {
    await periogramaModule.registrarPeriograma.executar({
      clinicaId: clinica.id,
      solicitadoPorUsuarioId: usuarioAdmin.id,
      prontuarioId: prontuario.id,
      tipo: "exame_inicial",
      dentes: [
        { numeroDente: 36, mobilidade: 1 },
        { numeroDente: 36, mobilidade: 2 },
      ],
    });
    denteDuplicadoPassou = true;
  } catch (erro) {
    if (!(erro instanceof DenteDuplicadoNoPeriogramaError)) {
      throw erro;
    }
    logResumo({
      excecaoRecebida: erro.nome,
      mensagem: erro.message,
      numeroDente: erro.numeroDente,
      camada: "dominio",
    });
    console.log("DEDUP DOMINIO OK");
  }
  if (denteDuplicadoPassou) {
    console.error(
      "FALHA: periograma com numeroDente duplicado foi aceito (deveria falhar no domínio)",
    );
    process.exit(1);
  }

  console.log(`\n${SEPARADOR}`);
  console.log("FLUXO COMPLETO EXECUTADO COM SUCESSO. Nenhum dado foi apagado.");
  console.log(SEPARADOR);
  console.log("IDs gerados nesta execução (para inspecionar no Neon):");
  console.log(
    JSON.stringify(
      {
        clinicaId: clinica.id,
        usuarioAdminId: usuarioAdmin.id,
        profissionalAdminId: profissionalAdmin.id,
        usuarioRecepcaoId: profissionalRecepcao.usuarioId,
        profissionalRecepcaoId: profissionalRecepcao.id,
        pacienteId: paciente.id,
        procedimentoId: procedimento.id,
        agendamentoId: agendamento.id,
        prontuarioId: prontuario.id,
        anamneseId: anamnese.id,
        evolucaoId: evolucao.id,
        auditoriaLeituraId: novaAuditoriaLeitura.id,
        rbacRecepcaoNegadoOk: !recepcaoConseguiuCriarProntuario,
        clinicaSegundaId: clinica2.id,
        isolamentoTenantOk: !vazouDadoEntreClinicas,
        receitaId: receita.id,
        pdfReceitaTamanhoBytes: pdfReceita.bytes.length,
        rbacReceitaRecepcaoNegadoOk: !recepcaoConseguiuEmitirReceita,
        assinaturaId: assinatura.id,
        assinaturaStatus: assinatura.status,
        acessoAtivoMotivo: resultadoAcesso.motivo,
        rbacPlataformaNegadoOk: !profissionalConseguiuConcederAcesso,
        eventosOdontogramaIds: eventosOdontograma.map((e) => e.id),
        denteAusenteNumero,
        regraDenteAusenteOk: !faceEmDenteAusentePassou,
        periogramaInicialId: periogramaInicial.id,
        periogramaReavaliacaoId: periogramaReavaliacao.id,
        validacaoFurcaOk: !furcaEmNaoMolarPassou,
        rbacOdontoPerioRecepcaoNegadoOk:
          !recepcaoConseguiuRegistrarPeriograma &&
          !recepcaoConseguiuRegistrarOdontograma,
        dedupDominioOk: !denteDuplicadoPassou,
      },
      null,
      2,
    ),
  );
}

/** Mascara credenciais da connection string ao logar qual banco será usado. */
function mascarar(connectionString) {
  try {
    const url = new URL(connectionString);
    return `${url.protocol}//${url.hostname}${url.pathname}`;
  } catch {
    return "(connection string ilegível)";
  }
}

main()
  .then(() => {
    // Encerra explicitamente: o pool de conexões do `pg` (singleton em
    // `@/db`) só fecha sozinho após o idle timeout, o que deixaria o
    // processo pendurado por alguns segundos sem necessidade.
    process.exit(0);
  })
  .catch((erro) => {
    console.error(`\n${SEPARADOR}`);
    console.error(
      "FALHA NO TESTE DE INTEGRAÇÃO MANUAL — execução interrompida no passo acima.",
    );
    console.error(SEPARADOR);
    console.error(erro);
    process.exit(1);
  });
