import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

import type { WorkflowStatus } from "./domain/nfse/status";
import {
  NfseRascunhoPage,
  type NfseRascunhoActions,
  type RascunhoNfseResultado,
  type PrestadorNfseSnapshot,
} from "./ui/nfse/NfseRascunhoPage";

const BASE_ROUTE = "/nfse/rascunho";
const API_BASE = "/api/nfse/rascunho";

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

const DATE_KEYS = new Set([
  "preValidadoAt",
  "previaGeradaAt",
  "aguardandoAprovacaoAt",
  "aprovadoClienteAt",
  "enviadoEmissaoAt",
  "autorizadoAt",
  "rejeitadoAt",
  "canceladoAt",
  "dataPrestacaoServico",
  "dataEmissaoRps",
  "dataHoraEmissaoNfse",
  "dataHoraEmissaoDps",
  "dataAutorizacao",
]);

function normalizePathname(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

function reviveApiValue(value: unknown, key?: string): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (value instanceof Date) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => reviveApiValue(entry));
  }

  if (typeof value === "string") {
    if (key && DATE_KEYS.has(key)) {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    return value;
  }

  if (typeof value !== "object") {
    return value;
  }

  const result: Record<string, unknown> = {};
  for (const [entryKey, entryValue] of Object.entries(value as Record<string, unknown>)) {
    result[entryKey] = reviveApiValue(entryValue, entryKey);
  }

  return result;
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const raw = await response.text();
  const body = raw ? (JSON.parse(raw) as Record<string, unknown>) : null;

  if (!response.ok) {
    const message =
      body && typeof body.error === "string"
        ? body.error
        : body && typeof body.message === "string"
          ? body.message
          : `Falha na requisicao: ${response.status}.`;
    throw new Error(message);
  }

  return reviveApiValue(body) as T;
}

function usePathname(): string {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const sync = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  useEffect(() => {
    const normalized = normalizePathname(pathname);
    if (normalized === "/" || !normalized.startsWith(BASE_ROUTE)) {
      if (window.location.pathname !== BASE_ROUTE) {
        window.history.replaceState(null, "", BASE_ROUTE);
      }
      if (pathname !== BASE_ROUTE) {
        setPathname(BASE_ROUTE);
      }
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
  if (!normalized.startsWith(`${BASE_ROUTE}/`)) {
    return undefined;
  }

  const rawId = normalized.slice(`${BASE_ROUTE}/`.length);
  return rawId ? decodeURIComponent(rawId) : undefined;
}

function createApiActions(): NfseRascunhoActions {
  return {
    async buscarRascunho({ rascunhoId }) {
      return requestJson<RascunhoNfseResultado>(`${API_BASE}/${encodeURIComponent(rascunhoId)}`);
    },

    async salvarOuAtualizar({ rascunhoId, input, prestador }) {
      const resultado = await requestJson<RascunhoNfseResultado>(API_BASE, {
        method: "POST",
        body: JSON.stringify({
          rascunhoId,
          input,
          prestador,
        }),
      });

      const nextPath = `${BASE_ROUTE}/${encodeURIComponent(resultado.rascunhoId)}`;
      if (window.location.pathname !== nextPath) {
        window.history.replaceState(null, "", nextPath);
      }

      return resultado;
    },

    async aprovar({ rascunhoId }) {
      return requestJson<RascunhoNfseResultado>(`${API_BASE}/${encodeURIComponent(rascunhoId)}/aprovar`, {
        method: "POST",
      });
    },

    async reprovar({ rascunhoId, observacaoValidacaoCliente }) {
      return requestJson<RascunhoNfseResultado>(`${API_BASE}/${encodeURIComponent(rascunhoId)}/reprovar`, {
        method: "POST",
        body: JSON.stringify({ observacaoValidacaoCliente }),
      });
    },
  };
}

const actions = createApiActions();

function App() {
  const pathname = usePathname();
  const rascunhoId = useMemo(() => resolveRascunhoId(pathname), [pathname]);
  const viewMode = new URLSearchParams(window.location.search).get("modo") === "cliente"
    ? "cliente"
    : "operador";

  return (
    <NfseRascunhoPage
      rascunhoId={rascunhoId}
      prestador={DEMO_PRESTADOR}
      actions={actions}
      modo={viewMode}
    />
  );
}

const root = document.getElementById("root");

if (!root) {
  throw new Error("Elemento root nao encontrado.");
}

createRoot(root).render(<App />);
