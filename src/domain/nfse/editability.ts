import type { WorkflowStatus } from "./status";

export const EDITABLE_DRAFT_STATUSES = [
  "RASCUNHO",
  "PRE_VALIDACAO",
  "REJEITADA",
] as const satisfies readonly WorkflowStatus[];

export class NfseDraftEditBlockedError extends Error {
  constructor(status: WorkflowStatus) {
    super(`Edicao do rascunho bloqueada no status ${status}.`);
    this.name = "NfseDraftEditBlockedError";
  }
}

export function canEditNfseDraft(status: WorkflowStatus): boolean {
  return EDITABLE_DRAFT_STATUSES.includes(status);
}

export function assertNfseDraftEditable(status: WorkflowStatus): void {
  if (!canEditNfseDraft(status)) {
    throw new NfseDraftEditBlockedError(status);
  }
}

