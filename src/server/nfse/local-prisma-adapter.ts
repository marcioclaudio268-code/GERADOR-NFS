import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";

import type { PrismaRascunhoNfseClient } from "../../application/nfse/rascunho-nfse.service";

type LocalDb = {
  rascunhos: Array<Record<string, unknown>>;
  previas: Array<Record<string, unknown>>;
};

const DB_DIR = path.join(os.tmpdir(), "gerador-nfs");
const DB_FILE = path.join(DB_DIR, "nfse-local-db.json");

const RASCUNHO_DATE_KEYS = new Set([
  "createdAt",
  "updatedAt",
  "preValidadoAt",
  "previaGeradaAt",
  "aguardandoAprovacaoAt",
  "aprovadoClienteAt",
  "enviadoEmissaoAt",
  "autorizadoAt",
  "rejeitadoAt",
  "canceladoAt",
  "dataEmissaoRps",
  "dataPrestacaoServico",
]);

const PREVIA_DATE_KEYS = new Set(["createdAt", "updatedAt"]);

const clone = <T>(value: T): T => {
  if (typeof globalThis.structuredClone === "function") {
    return globalThis.structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
};

function now() {
  return new Date();
}

function emptyDb(): LocalDb {
  return {
    rascunhos: [],
    previas: [],
  };
}

function reviveDate(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed;
}

function reviveRow<T extends Record<string, unknown>>(
  row: T,
  dateKeys: Set<string>,
): T {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(row)) {
    if (dateKeys.has(key)) {
      result[key] = reviveDate(value);
      continue;
    }

    result[key] = value;
  }

  return result as T;
}

function reviveDb(raw: LocalDb): LocalDb {
  return {
    rascunhos: raw.rascunhos.map((row) => reviveRow(row, RASCUNHO_DATE_KEYS)),
    previas: raw.previas.map((row) => reviveRow(row, PREVIA_DATE_KEYS)),
  };
}

async function loadDb(): Promise<LocalDb> {
  try {
    const raw = await readFile(DB_FILE, "utf8");
    const parsed = JSON.parse(raw) as LocalDb;
    return reviveDb(parsed);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return emptyDb();
    }

    throw error;
  }
}

function dehydrate(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((entry) => dehydrate(entry));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    result[key] = dehydrate(entry);
  }

  return result;
}

async function persistDb(db: LocalDb): Promise<void> {
  await mkdir(DB_DIR, { recursive: true });
  await writeFile(DB_FILE, JSON.stringify(dehydrate(db), null, 2), "utf8");
}

function upsertInArray<T extends Record<string, unknown>>(
  rows: T[],
  predicate: (row: T) => boolean,
  nextRow: T,
): T {
  const index = rows.findIndex(predicate);
  if (index >= 0) {
    rows[index] = nextRow;
  } else {
    rows.push(nextRow);
  }

  return nextRow;
}

function getMaxVersao(previas: LocalDb["previas"], rascunhoId: string): number | null {
  let max = null as number | null;

  for (const previa of previas) {
    if (previa.rascunhoId !== rascunhoId) {
      continue;
    }

    const versao = typeof previa.versao === "number" ? previa.versao : Number(previa.versao);
    if (!Number.isFinite(versao)) {
      continue;
    }

    if (max === null || versao > max) {
      max = versao;
    }
  }

  return max;
}

function createDraftMethods(
  state: { db: LocalDb; inTransaction: boolean; dirty: boolean; ready: Promise<void> },
) {
  const findUnique = async (args: { where: { id: string } }) => {
    await state.ready;
    const row = state.db.rascunhos.find((item) => item.id === args.where.id);
    return row ? clone(row) : null;
  };

  const create = async (args: { data: Record<string, unknown> }) => {
    await state.ready;
    const id = typeof args.data.id === "string" && args.data.id.trim() !== "" ? args.data.id : randomUUID();
    const timestamp = now();
    const row = reviveRow(
      {
        id,
        createdAt: timestamp,
        updatedAt: timestamp,
        ...clone(args.data),
      } as Record<string, unknown>,
      RASCUNHO_DATE_KEYS,
    );

    upsertInArray(
      state.db.rascunhos,
      (item) => item.id === id,
      row,
    );

    state.dirty = true;
    if (!state.inTransaction) {
      await persistDb(state.db);
      state.dirty = false;
    }

    return clone(row);
  };

  const update = async (args: { where: { id: string }; data: Record<string, unknown> }) => {
    await state.ready;
    const existing = state.db.rascunhos.find((item) => item.id === args.where.id);
    if (!existing) {
      throw new Error(`Rascunho NFSe nao encontrado: ${args.where.id}.`);
    }

    const nextRow = reviveRow(
      {
        ...existing,
        ...clone(args.data),
        updatedAt: now(),
      },
      RASCUNHO_DATE_KEYS,
    );

    upsertInArray(
      state.db.rascunhos,
      (item) => item.id === args.where.id,
      nextRow,
    );

    state.dirty = true;
    if (!state.inTransaction) {
      await persistDb(state.db);
      state.dirty = false;
    }

    return clone(nextRow);
  };

  const upsert = async (args: {
    where: { id: string };
    create: { id?: string } & Record<string, unknown>;
    update: Record<string, unknown>;
  }) => {
    await state.ready;
    const existing = state.db.rascunhos.find((item) => item.id === args.where.id);
    if (existing) {
      return update({ where: args.where, data: args.update });
    }

    return create({
      data: {
        id: args.create.id ?? args.where.id,
        ...args.create,
      },
    });
  };

  return {
    findUnique,
    create,
    update,
    upsert,
  };
}

function createPreviaMethods(
  state: { db: LocalDb; inTransaction: boolean; dirty: boolean; ready: Promise<void> },
) {
  return {
    async findFirst(args: {
      where?: { rascunhoId?: string };
      orderBy?: { versao?: "asc" | "desc" };
    }) {
      await state.ready;
      const rows = state.db.previas.filter((item) =>
        args.where?.rascunhoId ? item.rascunhoId === args.where.rascunhoId : true,
      );

      const sorted = [...rows].sort((a, b) => {
        const versaoA = typeof a.versao === "number" ? a.versao : Number(a.versao);
        const versaoB = typeof b.versao === "number" ? b.versao : Number(b.versao);
        return versaoA - versaoB;
      });

      const selected =
        args.orderBy?.versao === "desc"
          ? sorted.length > 0
            ? sorted[sorted.length - 1]
            : null
          : sorted[0] ?? null;

      return selected ? clone(selected) : null;
    },

    async create(args: { data: Record<string, unknown> }) {
      await state.ready;
      const id = typeof args.data.id === "string" && args.data.id.trim() !== "" ? args.data.id : randomUUID();
      const timestamp = now();
      const row = reviveRow(
        {
          id,
          createdAt: timestamp,
          updatedAt: timestamp,
          ...clone(args.data),
        } as Record<string, unknown>,
        PREVIA_DATE_KEYS,
      );

      state.db.previas.push(row);
      state.dirty = true;
      if (!state.inTransaction) {
        await persistDb(state.db);
        state.dirty = false;
      }

      return clone(row);
    },

    async aggregate(args: { where?: { rascunhoId?: string }; _max?: { versao?: boolean } }) {
      await state.ready;
      const rascunhoId = args.where?.rascunhoId;
      const maxVersao = rascunhoId ? getMaxVersao(state.db.previas, rascunhoId) : null;

      return {
        _max: {
          versao: maxVersao,
        },
      };
    },
  };
}

export function createLocalNfsePrismaAdapter(): PrismaRascunhoNfseClient {
  const state = {
    db: emptyDb(),
    inTransaction: false,
    dirty: false,
    ready: Promise.resolve(),
  };
  state.ready = loadDb().then((db) => {
    state.db = db;
  });

  const draft = createDraftMethods(state);
  const previa = createPreviaMethods(state);

  const adapter: PrismaRascunhoNfseClient = {
    nfseRascunho: draft as PrismaRascunhoNfseClient["nfseRascunho"],
    nfsePrevia: previa as PrismaRascunhoNfseClient["nfsePrevia"],
    async $transaction<T>(callback: (tx: PrismaRascunhoNfseClient) => Promise<T>): Promise<T> {
      await state.ready;
      const snapshot = clone(state.db);
      const dirtySnapshot = state.dirty;
      state.inTransaction = true;

      try {
        const result = await callback(adapter);
        state.inTransaction = false;
        if (state.dirty) {
          await persistDb(state.db);
          state.dirty = false;
        }
        return result;
      } catch (error) {
        state.inTransaction = false;
        state.db = snapshot;
        state.dirty = dirtySnapshot;
        await persistDb(state.db);
        throw error;
      }
    },
  };

  return adapter;
}
