import type { WorkflowStatus } from "./status";

export const WORKFLOW_TRANSITIONS: Record<WorkflowStatus, readonly WorkflowStatus[]> = {
  RASCUNHO: ["PRE_VALIDACAO"],
  PRE_VALIDACAO: ["PREVIA_GERADA", "RASCUNHO"],
  PREVIA_GERADA: ["AGUARDANDO_APROVACAO_CLIENTE", "RASCUNHO"],
  AGUARDANDO_APROVACAO_CLIENTE: ["APROVADO_CLIENTE", "REJEITADA", "RASCUNHO"],
  APROVADO_CLIENTE: ["EM_PROCESSAMENTO"],
  EM_PROCESSAMENTO: ["AUTORIZADA", "REJEITADA"],
  AUTORIZADA: ["CANCELADA"],
  REJEITADA: ["PRE_VALIDACAO", "RASCUNHO"],
  CANCELADA: [],
};

export class InvalidWorkflowTransitionError extends Error {
  constructor(from: WorkflowStatus, to: WorkflowStatus) {
    super(`Transicao de workflow invalida: ${from} -> ${to}.`);
    this.name = "InvalidWorkflowTransitionError";
  }
}

export function canTransitionWorkflowStatus(
  from: WorkflowStatus,
  to: WorkflowStatus,
): boolean {
  return WORKFLOW_TRANSITIONS[from].includes(to);
}

export function assertWorkflowTransition(from: WorkflowStatus, to: WorkflowStatus): void {
  if (!canTransitionWorkflowStatus(from, to)) {
    throw new InvalidWorkflowTransitionError(from, to);
  }
}

export function getAllowedWorkflowTransitions(
  from: WorkflowStatus,
): readonly WorkflowStatus[] {
  return WORKFLOW_TRANSITIONS[from];
}
