import { z } from "zod";

import { assertNfseDraftEditable } from "../../domain/nfse/editability";
import type { WorkflowStatus } from "../../domain/nfse/status";
import { assertWorkflowTransition } from "../../domain/nfse/transitions";
import {
  prestadorSnapshotSchema,
  workflowStatusSchema,
} from "../../schemas/nfse/_shared";
import { NfsePreviaCalculadaSchema } from "../../schemas/nfse/previa-nfse.schema";
import {
  RascunhoNfseInput,
  RascunhoNfseInputSchema,
} from "../../schemas/nfse/rascunho-nfse.schema";
import { prisma as defaultPrisma } from "../../lib/prisma";

export type PrestadorNfseSnapshot = z.infer<typeof prestadorSnapshotSchema>;
export type NfsePreviaNfse = z.infer<typeof NfsePreviaCalculadaSchema>;

export type RascunhoNfseCanonico = RascunhoNfseInput & PrestadorNfseSnapshot & {
  workflowStatus: WorkflowStatus;
  preValidadoAt?: Date | null;
  previaGeradaAt?: Date | null;
  aguardandoAprovacaoAt?: Date | null;
  aprovadoClienteAt?: Date | null;
  rejeitadoAt?: Date | null;
  canceladoAt?: Date | null;
  observacaoValidacaoCliente?: string | null;
};

export type RascunhoNfseResultado = {
  rascunhoId: string;
  workflowStatus: WorkflowStatus;
  draft: RascunhoNfseCanonico;
  previewVersion: number;
  preview: NfsePreviaNfse;
};

export type PrismaRascunhoNfseClient = {
  nfseRascunho: {
    findUnique(args: { where: { id: string } }): Promise<Record<string, unknown> | null>;
    create(args: { data: Record<string, unknown> }): Promise<Record<string, unknown>>;
    update(args: {
      where: { id: string };
      data: Record<string, unknown>;
    }): Promise<Record<string, unknown>>;
    upsert(args: {
      where: { id: string };
      create: { id?: string } & Record<string, unknown>;
      update: Record<string, unknown>;
    }): Promise<Record<string, unknown>>;
  };
  nfsePrevia: {
    findFirst(args: {
      where?: { rascunhoId?: string };
      orderBy?: { versao?: "asc" | "desc" };
    }): Promise<Record<string, unknown> | null>;
    create(args: { data: Record<string, unknown> }): Promise<Record<string, unknown>>;
    aggregate(args: {
      where?: { rascunhoId?: string };
      _max?: { versao?: boolean };
    }): Promise<{ _max: { versao: number | null } }>;
  };
  $transaction<T>(callback: (tx: PrismaRascunhoNfseClient) => Promise<T>): Promise<T>;
};

export type SalvarRascunhoNfseArgs = {
  rascunhoId?: string;
  input: RascunhoNfseInput;
  prestador: PrestadorNfseSnapshot;
};

export type ValidacaoClienteRascunhoNfseArgs = {
  rascunhoId: string;
  observacaoValidacaoCliente?: string;
};

const validacaoReprovacaoSchema = z.object({
  observacaoValidacaoCliente: z
    .string()
    .trim()
    .min(1, "Informe uma observacao para a reprovação.")
    .max(2000),
});

type ExistingDraftRow = Awaited<
  ReturnType<PrismaRascunhoNfseClient["nfseRascunho"]["findUnique"]>
>;

const DATA_KEYS_TO_DROP = new Set([
  "id",
  "createdAt",
  "updatedAt",
]);

function isDecimalLike(value: unknown): value is { toNumber: () => number } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { toNumber?: unknown }).toNumber === "function"
  );
}

function stripNullish<T>(value: T): T {
  if (value === null || value === undefined) {
    return value;
  }

  if (value instanceof Date) {
    return value;
  }

  if (isDecimalLike(value)) {
    return value.toNumber() as T;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => stripNullish(item))
      .filter((item) => item !== null && item !== undefined) as T;
  }

  if (typeof value !== "object") {
    return value;
  }

  const result: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (DATA_KEYS_TO_DROP.has(key)) {
      continue;
    }

    const cleaned = stripNullish(entry);
    if (cleaned !== null && cleaned !== undefined) {
      result[key] = cleaned;
    }
  }

  return result as T;
}

function mergeDefined<T extends Record<string, unknown>>(
  ...sources: Array<Partial<T> | undefined>
): T {
  const result: Record<string, unknown> = {};

  for (const source of sources) {
    if (!source) {
      continue;
    }

    for (const [key, value] of Object.entries(source)) {
      if (value !== undefined) {
        result[key] = value;
      }
    }
  }

  return result as T;
}

function asNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (isDecimalLike(value)) {
    return value.toNumber();
  }

  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function splitCompetencia(
  competencia: unknown,
): { competenciaMes?: number; competenciaAno?: number } {
  if (typeof competencia !== "string") {
    return {};
  }

  const match = /^(\d{4})-(\d{2})$/.exec(competencia.trim());
  if (!match) {
    return {};
  }

  return {
    competenciaAno: Number(match[1]),
    competenciaMes: Number(match[2]),
  };
}

function buildPreviewSnapshot(
  draft: RascunhoNfseCanonico,
  calculados: Pick<
    NfsePreviaNfse,
    | "baseCalculo"
    | "aliquotaAplicada"
    | "valorIssqn"
    | "valorLiquidoNfse"
    | "valorTotalNfse"
  >,
) {
  return stripNullish({
    prestador: {
      prestadorDocumento: draft.prestadorDocumento,
      prestadorRazaoSocial: draft.prestadorRazaoSocial,
      prestadorNomeFantasia: draft.prestadorNomeFantasia,
      prestadorInscricaoMunicipal: draft.prestadorInscricaoMunicipal,
      prestadorInscricaoEstadual: draft.prestadorInscricaoEstadual,
      prestadorEmail: draft.prestadorEmail,
      prestadorTelefone: draft.prestadorTelefone,
    },
    rpsDps: {
      numeroRps: draft.numeroRps,
      serieRps: draft.serieRps,
      dataEmissaoRps: draft.dataEmissaoRps,
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

function omitPreviewOnlyFields(draft: RascunhoNfseCanonico): Record<string, unknown> {
  const previewDraft = { ...draft } as Record<string, unknown>;
  delete previewDraft.observacaoValidacaoCliente;
  return previewDraft;
}

function mapDraftRowToCanonicalDraft(
  draftRow: ExistingDraftRow,
): RascunhoNfseCanonico {
  const draft = stripNullish(draftRow ?? {});
  delete (draft as Record<string, unknown>).competenciaMes;
  delete (draft as Record<string, unknown>).competenciaAno;
  delete (draft as Record<string, unknown>).situacaoTributaria;
  delete (draft as Record<string, unknown>).pisCofinsCsllSituacao;
  return draft as RascunhoNfseCanonico;
}

function buildDraftPersistencePayload(
  draft: RascunhoNfseCanonico,
): Record<string, unknown> {
  const persistencePayload = mergeDefined<Record<string, unknown>>(draft, {
    ...splitCompetencia(draft.competencia),
  });

  return persistencePayload;
}

function buildWorkflowSubmissionPayload(
  currentStatus: WorkflowStatus,
  now: Date,
): Pick<
  RascunhoNfseCanonico,
  | "workflowStatus"
  | "preValidadoAt"
  | "previaGeradaAt"
  | "aguardandoAprovacaoAt"
  | "aprovadoClienteAt"
  | "rejeitadoAt"
  | "enviadoEmissaoAt"
  | "autorizadoAt"
  | "canceladoAt"
  | "observacaoValidacaoCliente"
> {
  if (currentStatus === "RASCUNHO") {
    assertWorkflowTransition("RASCUNHO", "PRE_VALIDACAO");
    assertWorkflowTransition("PRE_VALIDACAO", "PREVIA_GERADA");
    assertWorkflowTransition("PREVIA_GERADA", "AGUARDANDO_APROVACAO_CLIENTE");
  } else if (currentStatus === "PRE_VALIDACAO") {
    assertWorkflowTransition("PRE_VALIDACAO", "PREVIA_GERADA");
    assertWorkflowTransition("PREVIA_GERADA", "AGUARDANDO_APROVACAO_CLIENTE");
  } else if (currentStatus === "REJEITADA") {
    assertWorkflowTransition("REJEITADA", "PRE_VALIDACAO");
    assertWorkflowTransition("PRE_VALIDACAO", "PREVIA_GERADA");
    assertWorkflowTransition("PREVIA_GERADA", "AGUARDANDO_APROVACAO_CLIENTE");
  }

  return {
    workflowStatus: "AGUARDANDO_APROVACAO_CLIENTE",
    preValidadoAt: now,
    previaGeradaAt: now,
    aguardandoAprovacaoAt: now,
    aprovadoClienteAt: null,
    rejeitadoAt: null,
    enviadoEmissaoAt: null,
    autorizadoAt: null,
    canceladoAt: null,
    observacaoValidacaoCliente: null,
  };
}

function buildPreviewFromDraft(
  draft: RascunhoNfseCanonico,
  legacyPreviewFields?: {
    situacaoTributaria?: string | null;
    pisCofinsCsllSituacao?: string | null;
  },
): NfsePreviaNfse {
  const valorServicos = asNumber(draft.valorServicos) ?? 0;
  const valorDeducoes = asNumber(draft.valorDeducoes) ?? 0;
  const descontoIncondicionado = asNumber(draft.descontoIncondicionado) ?? 0;
  const descontoCondicionado = asNumber(draft.descontoCondicionado) ?? 0;
  const previewDraft = omitPreviewOnlyFields(draft);

  // MVP conservador: calcula apenas a base simples visível ao cliente.
  // Nao tenta reproduzir regra fiscal municipal/provedor neste passo.
  const baseCalculo = round2(
    Math.max(
      valorServicos -
        valorDeducoes -
        descontoIncondicionado -
        descontoCondicionado,
      0,
    ),
  );

  const aliquotaAplicada = asNumber(draft.issqnAliquota);
  const valorIssqn =
    aliquotaAplicada === null ? undefined : round2((baseCalculo * aliquotaAplicada) / 100);

  const valorLiquidoNfse = round2(baseCalculo - (valorIssqn ?? 0));

  const preview: NfsePreviaNfse = NfsePreviaCalculadaSchema.parse(
    stripNullish({
      ...previewDraft,
      baseCalculo,
      aliquotaAplicada: aliquotaAplicada ?? undefined,
      valorIssqn,
      valorLiquidoNfse,
      // Campo mantido opcional no MVP; nao forcar sem regra final fechada.
      valorTotalNfse: undefined,
      situacaoTributaria: legacyPreviewFields?.situacaoTributaria ?? undefined,
      pisCofinsCsllSituacao: legacyPreviewFields?.pisCofinsCsllSituacao ?? undefined,
      snapshotJson: buildPreviewSnapshot(
        draft,
        stripNullish({
          baseCalculo,
          aliquotaAplicada: aliquotaAplicada ?? undefined,
          valorIssqn,
          valorLiquidoNfse,
          valorTotalNfse: undefined,
        }),
      ),
    }),
  );

  return preview;
}

async function findLatestPreview(
  prisma: PrismaRascunhoNfseClient,
  rascunhoId: string,
) {
  const preview = await prisma.nfsePrevia.findFirst({
    where: { rascunhoId },
    orderBy: { versao: "desc" },
  });

  return preview;
}

export class NfseRascunhoService {
  constructor(private readonly prisma: PrismaRascunhoNfseClient) {}

  async salvarOuAtualizar(
    args: SalvarRascunhoNfseArgs,
  ): Promise<RascunhoNfseResultado> {
    const input = RascunhoNfseInputSchema.parse(args.input);
    const prestador = prestadorSnapshotSchema.parse(args.prestador);

    const existingDraft = args.rascunhoId
      ? await this.prisma.nfseRascunho.findUnique({
          where: { id: args.rascunhoId },
        })
      : null;

    const currentWorkflowStatus: WorkflowStatus = existingDraft
      ? workflowStatusSchema.parse(existingDraft.workflowStatus)
      : "RASCUNHO";

    if (existingDraft) {
      assertNfseDraftEditable(currentWorkflowStatus);
    }

    const currentDraft = mapDraftRowToCanonicalDraft(existingDraft ?? ({} as ExistingDraftRow));
    // MVP direto: salvar gera a previa e deixa o documento pronto para aprovacao do cliente.
    const workflowSubmission = buildWorkflowSubmissionPayload(currentWorkflowStatus, new Date());

    const draft = stripNullish(
      mergeDefined<Record<string, unknown>>(currentDraft, input, prestador, workflowSubmission),
    ) as RascunhoNfseCanonico;

    const draftPersistencePayload = buildDraftPersistencePayload(draft);
    const legacyPreviewFields = existingDraft
      ? {
          situacaoTributaria: existingDraft.situacaoTributaria,
          pisCofinsCsllSituacao: existingDraft.pisCofinsCsllSituacao,
        }
      : undefined;
    const preview = buildPreviewFromDraft(draft, legacyPreviewFields);

    const { rascunho, previa } = await this.prisma.$transaction(async (tx) => {
      const rascunhoSalvo = args.rascunhoId
        ? await tx.nfseRascunho.upsert({
            where: { id: args.rascunhoId },
            create: {
              id: args.rascunhoId,
              ...draftPersistencePayload,
            },
            update: {
              ...draftPersistencePayload,
            },
          })
        : await tx.nfseRascunho.create({
            data: draftPersistencePayload,
          });

      const { _max } = await tx.nfsePrevia.aggregate({
        where: { rascunhoId: rascunhoSalvo.id },
        _max: { versao: true },
      });

      const previewVersion = (_max.versao ?? 0) + 1;

      const previaSalva = await tx.nfsePrevia.create({
        data: {
          rascunhoId: rascunhoSalvo.id,
          versao: previewVersion,
          baseCalculo: preview.baseCalculo,
          aliquotaAplicada: preview.aliquotaAplicada,
          valorIssqn: preview.valorIssqn,
          valorLiquidoNfse: preview.valorLiquidoNfse,
          situacaoTributaria: preview.situacaoTributaria,
          pisCofinsCsllSituacao: preview.pisCofinsCsllSituacao,
          snapshotJson: preview.snapshotJson,
        },
      });

      return {
        rascunho: rascunhoSalvo,
        previa: previaSalva,
      };
    });

    return {
      rascunhoId: rascunho.id,
      workflowStatus: workflowSubmission.workflowStatus,
      draft,
      previewVersion: previa.versao,
      preview,
    };
  }

  async aprovarCliente(rascunhoId: string): Promise<RascunhoNfseResultado> {
    const rascunho = await this.prisma.nfseRascunho.findUnique({
      where: { id: rascunhoId },
    });

    if (!rascunho) {
      throw new Error(`Rascunho NFSe nao encontrado: ${rascunhoId}.`);
    }

    const currentStatus = workflowStatusSchema.parse(rascunho.workflowStatus);
    assertWorkflowTransition(currentStatus, "APROVADO_CLIENTE");

    const agora = new Date();
    await this.prisma.nfseRascunho.update({
      where: { id: rascunhoId },
      data: {
        workflowStatus: "APROVADO_CLIENTE",
        aprovadoClienteAt: agora,
        rejeitadoAt: null,
        observacaoValidacaoCliente: null,
      },
    });

    const resultado = await this.buscar(rascunhoId);
    if (!resultado) {
      throw new Error(`Nao foi possivel carregar o rascunho atualizado: ${rascunhoId}.`);
    }

    return resultado;
  }

  async reprovarCliente(
    rascunhoId: string,
    observacaoValidacaoCliente: string,
  ): Promise<RascunhoNfseResultado> {
    const validacao = validacaoReprovacaoSchema.parse({
      observacaoValidacaoCliente,
    });

    const rascunho = await this.prisma.nfseRascunho.findUnique({
      where: { id: rascunhoId },
    });

    if (!rascunho) {
      throw new Error(`Rascunho NFSe nao encontrado: ${rascunhoId}.`);
    }

    const currentStatus = workflowStatusSchema.parse(rascunho.workflowStatus);
    assertWorkflowTransition(currentStatus, "REJEITADA");

    const agora = new Date();
    await this.prisma.nfseRascunho.update({
      where: { id: rascunhoId },
      data: {
        workflowStatus: "REJEITADA",
        rejeitadoAt: agora,
        aprovadoClienteAt: null,
        observacaoValidacaoCliente: validacao.observacaoValidacaoCliente,
      },
    });

    const resultado = await this.buscar(rascunhoId);
    if (!resultado) {
      throw new Error(`Nao foi possivel carregar o rascunho atualizado: ${rascunhoId}.`);
    }

    return resultado;
  }

  async buscar(rascunhoId: string): Promise<RascunhoNfseResultado | null> {
    const rascunho = await this.prisma.nfseRascunho.findUnique({
      where: { id: rascunhoId },
    });

    if (!rascunho) {
      return null;
    }

    const latestPreview = await findLatestPreview(this.prisma, rascunho.id);
    const draft = mapDraftRowToCanonicalDraft(rascunho);
    const workflowStatus = draft.workflowStatus;

    const preview = latestPreview
      ? NfsePreviaCalculadaSchema.parse(
          stripNullish({
            ...omitPreviewOnlyFields(draft),
            baseCalculo: latestPreview.baseCalculo ?? undefined,
            aliquotaAplicada: latestPreview.aliquotaAplicada ?? undefined,
            valorIssqn: latestPreview.valorIssqn ?? undefined,
            valorLiquidoNfse: latestPreview.valorLiquidoNfse ?? undefined,
            valorTotalNfse: latestPreview.valorTotalNfse ?? undefined,
            situacaoTributaria:
              latestPreview.situacaoTributaria ?? undefined,
            pisCofinsCsllSituacao:
              latestPreview.pisCofinsCsllSituacao ?? undefined,
            snapshotJson: latestPreview.snapshotJson ?? undefined,
          }),
        )
      : buildPreviewFromDraft(draft, {
          situacaoTributaria: rascunho.situacaoTributaria,
          pisCofinsCsllSituacao: rascunho.pisCofinsCsllSituacao,
        });

    return {
      rascunhoId: rascunho.id,
      workflowStatus,
      draft,
      previewVersion: latestPreview?.versao ?? 0,
      preview,
    };
  }
}

export const nfseRascunhoService = new NfseRascunhoService(defaultPrisma);

export async function salvarOuAtualizarRascunhoNfseAction(args: {
  rascunhoId?: string;
  input: unknown;
  prestador: unknown;
  prisma?: PrismaRascunhoNfseClient;
}): Promise<RascunhoNfseResultado> {
  const service = args.prisma
    ? new NfseRascunhoService(args.prisma)
    : nfseRascunhoService;

  return service.salvarOuAtualizar({
    rascunhoId: args.rascunhoId,
    input: RascunhoNfseInputSchema.parse(args.input),
    prestador: prestadorSnapshotSchema.parse(args.prestador),
  });
}

export async function buscarRascunhoNfseAction(args: {
  rascunhoId: string;
  prisma?: PrismaRascunhoNfseClient;
}): Promise<RascunhoNfseResultado | null> {
  const service = args.prisma
    ? new NfseRascunhoService(args.prisma)
    : nfseRascunhoService;

  return service.buscar(args.rascunhoId);
}

export async function aprovarRascunhoNfseAction(args: {
  rascunhoId: string;
  prisma?: PrismaRascunhoNfseClient;
}): Promise<RascunhoNfseResultado> {
  const service = args.prisma
    ? new NfseRascunhoService(args.prisma)
    : nfseRascunhoService;

  return service.aprovarCliente(args.rascunhoId);
}

export async function reprovarRascunhoNfseAction(args: {
  rascunhoId: string;
  observacaoValidacaoCliente: string;
  prisma?: PrismaRascunhoNfseClient;
}): Promise<RascunhoNfseResultado> {
  const service = args.prisma
    ? new NfseRascunhoService(args.prisma)
    : nfseRascunhoService;

  return service.reprovarCliente(
    args.rascunhoId,
    args.observacaoValidacaoCliente,
  );
}
