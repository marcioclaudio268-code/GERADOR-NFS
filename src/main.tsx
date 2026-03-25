import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

import { assertWorkflowTransition } from "./domain/nfse/transitions";
import { canEditNfseDraft } from "./domain/nfse/editability";
import type { WorkflowStatus } from "./domain/nfse/status";
import { NfsePreviaCalculadaSchema } from "./schemas/nfse/previa-nfse.schema";
import {
  NfseRascunhoPage,
  type NfsePreviaNfse,
  type NfseRascunhoActions,
  type NfseRascunhoCanonico,
  type NfseRascunhoResultado,
  type PrestadorNfseSnapshot,
} from "./ui/nfse/NfseRascunhoPage";

const STORAGE_PREFIX = "nfse-mvp-host";
const LAST_RASCUNHO_ID_KEY = `${STORAGE_PREFIX}:last-rascunho-id`;
const BASE_ROUTE = "/nfse/rascunho";

const DEMO_PRESTADOR = {
  prestadorDocumento: "12345678000199",
  prestadorRazaoSocial: "Escritorio Contabil Exemplo Ltda",
  prestadorNomeFantasia: "Exemplo Contabil",
  prestadorInscricaoMunicipal: "123456",
  prestadorInscricaoEstadual: undefined,
  prestadorEmail: "contato@exemplo.com.br",
  prestadorTelefone: "1133334444",
  prestadorEndereco: "Rua Exemplo, 100",
  prestadorMunicipio: "Sao Paulo",
  prestadorUf: "SP",
  prestadorCep: "01000000",
} satisfies PrestadorNfseSnapshot;

function normalizePathname(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

function makeDraftId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `nfse_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function encodeStoredValue(value: unknown): string {
  return JSON.stringify(value, (_key, current) => {
    if (current instanceof Date) {
      return { __nfseDate: current.toISOString() };
    }

    return current;
  });
}

function decodeStoredValue<T>(raw: string): T {
  return JSON.parse(raw, (_key, current) => {
    if (
      current &&
      typeof current === "object" &&
      "__nfseDate" in current &&
      typeof (current as { __nfseDate?: unknown }).__nfseDate === "string"
    ) {
      return new Date((current as { __nfseDate: string }).__nfseDate);
    }

    return current;
  }) as T;
}

function compactDeep<T>(value: T): T {
  if (value === null || value === undefined) {
    return value;
  }

  if (value instanceof Date) {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => compactDeep(item))
      .filter((item) => item !== null && item !== undefined) as T;
  }

  if (typeof value !== "object") {
    return value;
  }

  const result: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    const cleaned = compactDeep(entry);
    if (cleaned !== null && cleaned !== undefined) {
      result[key] = cleaned;
    }
  }

  return result as T;
}

function asNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function readStoredResultado(rascunhoId: string): RascunhoNfseResultado | null {
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}:rascunho:${rascunhoId}`);
    return raw ? decodeStoredValue<RascunhoNfseResultado>(raw) : null;
  } catch {
    return null;
  }
}

function writeStoredResultado(resultado: RascunhoNfseResultado): void {
  window.localStorage.setItem(
    `${STORAGE_PREFIX}:rascunho:${resultado.rascunhoId}`,
    encodeStoredValue(resultado),
  );
  window.localStorage.setItem(LAST_RASCUNHO_ID_KEY, resultado.rascunhoId);
}

function syncRouteToRascunhoId(rascunhoId: string): void {
  const nextPath = `${BASE_ROUTE}/${encodeURIComponent(rascunhoId)}`;
  if (window.location.pathname !== nextPath) {
    window.history.replaceState(null, "", nextPath);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
}

function buildPreviewSnapshot(
  draft: NfseRascunhoCanonico,
  calculados: Pick<
    NfsePreviaNfse,
    "baseCalculo" | "aliquotaAplicada" | "valorIssqn" | "valorLiquidoNfse" | "valorTotalNfse"
  >,
) {
  return compactDeep({
    prestador: {
      prestadorDocumento: draft.prestadorDocumento,
      prestadorRazaoSocial: draft.prestadorRazaoSocial,
      prestadorNomeFantasia: draft.prestadorNomeFantasia,
      prestadorInscricaoMunicipal: draft.prestadorInscricaoMunicipal,
      prestadorInscricaoEstadual: draft.prestadorInscricaoEstadual,
      prestadorEmail: draft.prestadorEmail,
      prestadorTelefone: draft.prestadorTelefone,
    },
    tomador: {
      tomadorDocumento: draft.tomadorDocumento,
      tomadorRazaoSocial: draft.tomadorRazaoSocial,
      tomadorNomeFantasia: draft.tomadorNomeFantasia,
      tomadorEmail: draft.tomadorEmail,
      tomadorTelefone: draft.tomadorTelefone,
      tomadorInscricaoMunicipal: draft.tomadorInscricaoMunicipal,
      tomadorInscricaoEstadual: draft.tomadorInscricaoEstadual,
      tomadorEndereco: draft.tomadorEndereco,
      tomadorMunicipio: draft.tomadorMunicipio,
      tomadorUf: draft.tomadorUf,
      tomadorCep: draft.tomadorCep,
    },
    intermediario: {
      intermediarioDocumento: draft.intermediarioDocumento,
      intermediarioRazaoSocial: draft.intermediarioRazaoSocial,
      intermediarioInscricaoMunicipal: draft.intermediarioInscricaoMunicipal,
      intermediarioEmail: draft.intermediarioEmail,
      intermediarioTelefone: draft.intermediarioTelefone,
      intermediarioEndereco: draft.intermediarioEndereco,
      intermediarioMunicipio: draft.intermediarioMunicipio,
      intermediarioUf: draft.intermediarioUf,
      intermediarioCep: draft.intermediarioCep,
    },
    servico: {
      competencia: draft.competencia,
      dataPrestacaoServico: draft.dataPrestacaoServico,
      descricaoServico: draft.descricaoServico,
      codigoServicoMunicipal: draft.codigoServicoMunicipal,
      itemListaServico: draft.itemListaServico,
      codigoCnae: draft.codigoCnae,
      codigoNbs: draft.codigoNbs,
      observacoes: draft.observacoes,
      informacoesComplementares: draft.informacoesComplementares,
    },
    localPrestacao: {
      paisPrestacao: draft.paisPrestacao,
      municipioPrestacao: draft.municipioPrestacao,
      ufPrestacao: draft.ufPrestacao,
      municipioIncidencia: draft.municipioIncidencia,
      localServico: draft.localServico,
      tomadorLocalizacao: draft.tomadorLocalizacao,
      intermediarioLocalizacao: draft.intermediarioLocalizacao,
    },
    valores: {
      valorServicos: draft.valorServicos,
      valorDeducoes: draft.valorDeducoes,
      descontoIncondicionado: draft.descontoIncondicionado,
      descontoCondicionado: draft.descontoCondicionado,
      valorRetencaoPis: draft.valorRetencaoPis,
      valorRetencaoCofins: draft.valorRetencaoCofins,
      valorRetencaoCsll: draft.valorRetencaoCsll,
      irrfValorImposto: draft.irrfValorImposto,
      inssCpIm: draft.inssCpIm,
      contribuicoesSociaisRetidas: draft.contribuicoesSociaisRetidas,
      issRetido: draft.issRetido,
      issqnAliquota: draft.issqnAliquota,
    },
    calculados,
  });
}

function buildPreviewFromDraft(draft: NfseRascunhoCanonico): NfsePreviaNfse {
  const valorServicos = asNumber(draft.valorServicos) ?? 0;
  const valorDeducoes = asNumber(draft.valorDeducoes) ?? 0;
  const descontoIncondicionado = asNumber(draft.descontoIncondicionado) ?? 0;
  const descontoCondicionado = asNumber(draft.descontoCondicionado) ?? 0;

  const baseCalculo = round2(
    Math.max(
      valorServicos - valorDeducoes - descontoIncondicionado - descontoCondicionado,
      0,
    ),
  );

  const aliquotaAplicada = asNumber(draft.issqnAliquota);
  const valorIssqn =
    aliquotaAplicada === null ? undefined : round2((baseCalculo * aliquotaAplicada) / 100);
  const valorLiquidoNfse = round2(baseCalculo - (valorIssqn ?? 0));

  return NfsePreviaCalculadaSchema.parse(
    compactDeep({
      ...draft,
      baseCalculo,
      aliquotaAplicada: aliquotaAplicada ?? undefined,
      valorIssqn,
      valorLiquidoNfse,
      valorTotalNfse: undefined,
      situacaoTributaria: undefined,
      pisCofinsCsllSituacao: undefined,
      snapshotJson: buildPreviewSnapshot(draft, {
        baseCalculo,
        aliquotaAplicada: aliquotaAplicada ?? undefined,
        valorIssqn,
        valorLiquidoNfse,
        valorTotalNfse: undefined,
      }),
    }),
  );
}

function createWorkflowDraft(
  currentDraft: Partial<NfseRascunhoCanonico> | null,
  input: NfseRascunhoCanonico,
  prestador: PrestadorNfseSnapshot,
): NfseRascunhoCanonico {
  const agora = new Date();
  return compactDeep({
    ...(currentDraft ?? {}),
    ...input,
    ...prestador,
    workflowStatus: "AGUARDANDO_APROVACAO_CLIENTE" as WorkflowStatus,
    preValidadoAt: agora,
    previaGeradaAt: agora,
    aguardandoAprovacaoAt: agora,
    aprovadoClienteAt: null,
    rejeitadoAt: null,
    canceladoAt: null,
    observacaoValidacaoCliente: null,
  });
}

const browserActions: NfseRascunhoActions = {
  async buscarRascunho({ rascunhoId }) {
    return readStoredResultado(rascunhoId);
  },

  async salvarOuAtualizar({ rascunhoId, input, prestador }) {
    const currentId = rascunhoId ?? readStoredResultado(window.localStorage.getItem(LAST_RASCUNHO_ID_KEY) ?? "")?.rascunhoId;
    const existing = currentId ? readStoredResultado(currentId) : null;

    if (existing && !canEditNfseDraft(existing.workflowStatus)) {
      throw new Error(`Edicao do rascunho bloqueada no status ${existing.workflowStatus}.`);
    }

    const draftId = currentId ?? makeDraftId();
    const draft = createWorkflowDraft(existing?.draft ?? null, input as NfseRascunhoCanonico, prestador);
    const preview = buildPreviewFromDraft(draft);
    const resultado: RascunhoNfseResultado = {
      rascunhoId: draftId,
      workflowStatus: draft.workflowStatus,
      draft,
      previewVersion: (existing?.previewVersion ?? 0) + 1,
      preview,
    };

    writeStoredResultado(resultado);
    syncRouteToRascunhoId(draftId);

    return resultado;
  },

  async aprovar({ rascunhoId }) {
    const existing = readStoredResultado(rascunhoId);
    if (!existing) {
      throw new Error(`Rascunho NFSe nao encontrado: ${rascunhoId}.`);
    }

    assertWorkflowTransition(existing.workflowStatus, "APROVADO_CLIENTE");

    const agora = new Date();
    const resultado: RascunhoNfseResultado = {
      ...existing,
      workflowStatus: "APROVADO_CLIENTE",
      draft: compactDeep({
        ...existing.draft,
        workflowStatus: "APROVADO_CLIENTE",
        aprovadoClienteAt: agora,
        rejeitadoAt: null,
        observacaoValidacaoCliente: null,
      }),
    };

    writeStoredResultado(resultado);
    return resultado;
  },

  async reprovar({ rascunhoId, observacaoValidacaoCliente }) {
    const existing = readStoredResultado(rascunhoId);
    if (!existing) {
      throw new Error(`Rascunho NFSe nao encontrado: ${rascunhoId}.`);
    }

    assertWorkflowTransition(existing.workflowStatus, "REJEITADA");

    const observacao = observacaoValidacaoCliente.trim();
    if (!observacao) {
      throw new Error("Informe uma observacao para a reprovaçao.");
    }

    const agora = new Date();
    const resultado: RascunhoNfseResultado = {
      ...existing,
      workflowStatus: "REJEITADA",
      draft: compactDeep({
        ...existing.draft,
        workflowStatus: "REJEITADA",
        rejeitadoAt: agora,
        aprovadoClienteAt: null,
        observacaoValidacaoCliente: observacao,
      }),
    };

    writeStoredResultado(resultado);
    return resultado;
  },
};

function usePathname(): string {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const sync = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  useEffect(() => {
    const normalized = normalizePathname(pathname);
    if (normalized === "/") {
      window.history.replaceState(null, "", BASE_ROUTE);
      setPathname(BASE_ROUTE);
      return;
    }

    if (!normalized.startsWith(BASE_ROUTE)) {
      window.history.replaceState(null, "", BASE_ROUTE);
      setPathname(BASE_ROUTE);
      return;
    }

    if (normalized !== pathname) {
      window.history.replaceState(null, "", normalized);
      setPathname(normalized);
    }
  }, [pathname]);

  return normalizePathname(pathname);
}

function resolveRascunhoId(pathname: string): string | undefined {
  const normalized = normalizePathname(pathname);

  if (normalized.startsWith(`${BASE_ROUTE}/`)) {
    const rawId = normalized.slice(`${BASE_ROUTE}/`.length);
    return rawId ? decodeURIComponent(rawId) : undefined;
  }

  if (normalized === BASE_ROUTE || normalized === "/") {
    const lastId = window.localStorage.getItem(LAST_RASCUNHO_ID_KEY);
    return lastId ?? undefined;
  }

  return undefined;
}

function App() {
  const pathname = usePathname();
  const rascunhoId = useMemo(() => resolveRascunhoId(pathname), [pathname]);
  const initialResultado = rascunhoId ? readStoredResultado(rascunhoId) : null;

  return (
    <NfseRascunhoPage
      rascunhoId={rascunhoId}
      prestador={DEMO_PRESTADOR}
      initialResultado={initialResultado}
      actions={browserActions}
    />
  );
}

const root = document.getElementById("root");

if (!root) {
  throw new Error("Elemento root nao encontrado.");
}

createRoot(root).render(
  <App />,
);
