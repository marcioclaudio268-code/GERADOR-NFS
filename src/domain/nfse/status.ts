export const WORKFLOW_STATUS_VALUES = [
  "RASCUNHO",
  "PRE_VALIDACAO",
  "PREVIA_GERADA",
  "AGUARDANDO_APROVACAO_CLIENTE",
  "APROVADO_CLIENTE",
  "EM_PROCESSAMENTO",
  "AUTORIZADA",
  "REJEITADA",
  "CANCELADA",
] as const;

export type WorkflowStatus = (typeof WORKFLOW_STATUS_VALUES)[number];

export const STATUS_AUTORIZACAO_VALUES = [
  "NAO_ENVIADA",
  "EM_PROCESSAMENTO",
  "AUTORIZADA",
  "REJEITADA",
  "CANCELADA",
  "ERRO_INTEGRACAO",
] as const;

export type StatusAutorizacao = (typeof STATUS_AUTORIZACAO_VALUES)[number];

export const WORKFLOW_STATUS_ALIASES: Record<string, WorkflowStatus> = {
  AGUARDANDO_APROVACAO: "AGUARDANDO_APROVACAO_CLIENTE",
  APROVADO: "APROVADO_CLIENTE",
  EMITIDO: "AUTORIZADA",
  CANCELADO: "CANCELADA",
  REPROVADO: "REJEITADA",
};

export const STATUS_AUTORIZACAO_ALIASES: Record<string, StatusAutorizacao> = {
  PENDENTE: "NAO_ENVIADA",
};

const WORKFLOW_STATUS_SET = new Set<WorkflowStatus>(WORKFLOW_STATUS_VALUES);
const STATUS_AUTORIZACAO_SET = new Set<StatusAutorizacao>(STATUS_AUTORIZACAO_VALUES);

export function normalizeWorkflowStatus(value: unknown): WorkflowStatus | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toUpperCase();
  if (normalized === "") {
    return undefined;
  }

  const alias = WORKFLOW_STATUS_ALIASES[normalized];
  if (alias) {
    return alias;
  }

  return WORKFLOW_STATUS_SET.has(normalized as WorkflowStatus)
    ? (normalized as WorkflowStatus)
    : undefined;
}

export function normalizeStatusAutorizacao(value: unknown): StatusAutorizacao | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toUpperCase();
  if (normalized === "") {
    return undefined;
  }

  const alias = STATUS_AUTORIZACAO_ALIASES[normalized];
  if (alias) {
    return alias;
  }

  return STATUS_AUTORIZACAO_SET.has(normalized as StatusAutorizacao)
    ? (normalized as StatusAutorizacao)
    : undefined;
}
