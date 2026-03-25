import { z } from "zod";

import {
  STATUS_AUTORIZACAO_VALUES,
  WORKFLOW_STATUS_VALUES,
  normalizeStatusAutorizacao,
  normalizeWorkflowStatus,
} from "../../domain/nfse/status";

const normalizeEmpty = (value: unknown) => {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
};

const normalizeBoolean = (value: unknown) => {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    return value;
  }

  const normalized = value.trim().toLowerCase();

  if (["true", "1", "sim", "s", "on", "yes"].includes(normalized)) {
    return true;
  }

  if (["false", "0", "nao", "n", "off", "no"].includes(normalized)) {
    return false;
  }

  return value;
};

const normalizeDigits = (value: unknown) => {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    return value;
  }

  const digits = value.replace(/\D+/g, "");
  return digits === "" ? undefined : digits;
};

const normalizeDecimal = (value: unknown) => {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  if (trimmed === "") {
    return undefined;
  }

  if (trimmed.includes(",") && trimmed.includes(".")) {
    return trimmed.replace(/\./g, "").replace(",", ".");
  }

  if (trimmed.includes(",")) {
    return trimmed.replace(",", ".");
  }

  return trimmed;
};

const normalizeLegacyCompetencia = (value: unknown) => {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const record = { ...(value as Record<string, unknown>) };

  if (record.competencia === undefined) {
    const mes = record.competenciaMes;
    const ano = record.competenciaAno;

    const mesNumber = typeof mes === "number" ? mes : typeof mes === "string" ? Number(mes) : NaN;
    const anoNumber = typeof ano === "number" ? ano : typeof ano === "string" ? Number(ano) : NaN;

    if (Number.isInteger(mesNumber) && mesNumber >= 1 && mesNumber <= 12 && Number.isInteger(anoNumber) && anoNumber > 0) {
      record.competencia = `${String(anoNumber).padStart(4, "0")}-${String(mesNumber).padStart(2, "0")}`;
    }
  }

  delete record.competenciaMes;
  delete record.competenciaAno;

  return record;
};

export const normalizeRascunhoNfseInput = (value: unknown) => {
  const normalized = normalizeLegacyCompetencia(value);

  if (normalized === null || normalized === undefined) {
    return normalized;
  }

  if (typeof normalized !== "object" || Array.isArray(normalized)) {
    return normalized;
  }

  const record = { ...(normalized as Record<string, unknown>) };

  const rename = (from: string, to: string) => {
    if (record[to] === undefined && record[from] !== undefined) {
      record[to] = record[from];
    }
    delete record[from];
  };

  rename("servicosPrestadosCodigo", "codigoServicoMunicipal");
  rename("dataEmissao", "dataPrestacaoServico");
  rename("valorServicoPrestado", "valorServicos");
  rename("inssCpImpostoRetido", "inssCpIm");
  rename("tomadorCnpjCpf", "tomadorDocumento");
  rename("intermediarioCnpjCpf", "intermediarioDocumento");

  return record;
};

const requiredTextSchema = () =>
  z.preprocess(normalizeEmpty, z.string().trim().min(1));

const optionalTextSchema = () =>
  z.preprocess(normalizeEmpty, z.string().trim().min(1).optional());

const optionalEmailSchema = () =>
  z.preprocess(normalizeEmpty, z.string().trim().email().optional());

const requiredDocumentSchema = () =>
  z.preprocess(normalizeDigits, z.string().min(11).max(14));

const optionalDocumentSchema = () =>
  z.preprocess(normalizeDigits, z.string().min(11).max(14).optional());

const requiredCepSchema = () =>
  z.preprocess(normalizeDigits, z.string().length(8));

const optionalCepSchema = () =>
  z.preprocess(normalizeDigits, z.string().length(8).optional());

const optionalPhoneSchema = () =>
  z.preprocess(normalizeDigits, z.string().min(8).max(13).optional());

const requiredUfSchema = () =>
  z.preprocess(normalizeEmpty, z.string().trim().toUpperCase().length(2));

const optionalUfSchema = () =>
  z.preprocess(normalizeEmpty, z.string().trim().toUpperCase().length(2).optional());

const requiredDateSchema = () =>
  z.preprocess(
    normalizeEmpty,
    z.union([z.string(), z.date()]).pipe(z.coerce.date()),
  );

const optionalDateSchema = () =>
  z.preprocess(
    normalizeEmpty,
    z.union([z.string(), z.date()]).pipe(z.coerce.date()).optional(),
  );

const requiredDecimalSchema = () =>
  z.preprocess(
    normalizeDecimal,
    z.union([z.number(), z.string()]).pipe(z.coerce.number().finite().nonnegative()),
  );

const optionalDecimalSchema = () =>
  z.preprocess(
    normalizeDecimal,
    z.union([z.number(), z.string()]).pipe(z.coerce.number().finite().nonnegative()).optional(),
  );

const optionalBooleanSchema = () =>
  z.preprocess(normalizeBoolean, z.boolean().optional());

const requiredCompetenciaSchema = () =>
  z.preprocess(normalizeEmpty, z.string().trim().min(1));

const optionalJsonSchema = () => z.unknown().optional();

export const workflowStatusSchema = z.preprocess(
  normalizeWorkflowStatus,
  z.enum(WORKFLOW_STATUS_VALUES),
);

export const statusAutorizacaoSchema = z.preprocess(
  normalizeStatusAutorizacao,
  z.enum(STATUS_AUTORIZACAO_VALUES),
);

export const controleOperacionalSchema = z
  .object({
    tomadorLocalizacao: optionalTextSchema(),
    intermediarioLocalizacao: optionalTextSchema(),
  })
  .strict();

export const prestadorSnapshotSchema = z
  .object({
    prestadorDocumento: requiredDocumentSchema(),
    prestadorRazaoSocial: requiredTextSchema(),
    prestadorNomeFantasia: optionalTextSchema(),
    prestadorInscricaoMunicipal: requiredTextSchema(),
    prestadorInscricaoEstadual: optionalTextSchema(),
    prestadorEmail: optionalEmailSchema(),
    prestadorTelefone: optionalPhoneSchema(),
    prestadorEndereco: optionalTextSchema(),
    prestadorMunicipio: optionalTextSchema(),
    prestadorUf: optionalUfSchema(),
    prestadorCep: optionalCepSchema(),
  })
  .strict();

export const tomadorSchema = z
  .object({
    tomadorDocumento: optionalDocumentSchema(),
    tomadorRazaoSocial: optionalTextSchema(),
    tomadorNomeFantasia: optionalTextSchema(),
    tomadorEmail: optionalEmailSchema(),
    tomadorTelefone: optionalPhoneSchema(),
    tomadorInscricaoMunicipal: optionalTextSchema(),
    tomadorInscricaoEstadual: optionalTextSchema(),
    tomadorEndereco: optionalTextSchema(),
    tomadorMunicipio: optionalTextSchema(),
    tomadorUf: optionalUfSchema(),
    tomadorCep: optionalCepSchema(),
  })
  .strict();

export const intermediarioSchema = z
  .object({
    intermediarioDocumento: optionalDocumentSchema(),
    intermediarioRazaoSocial: optionalTextSchema(),
    intermediarioInscricaoMunicipal: optionalTextSchema(),
    intermediarioEmail: optionalEmailSchema(),
    intermediarioTelefone: optionalPhoneSchema(),
    intermediarioEndereco: optionalTextSchema(),
    intermediarioMunicipio: optionalTextSchema(),
    intermediarioUf: optionalUfSchema(),
    intermediarioCep: optionalCepSchema(),
  })
  .strict();

export const rpsDpsSchema = z
  .object({
    numeroRps: optionalTextSchema(),
    serieRps: optionalTextSchema(),
    dataEmissaoRps: optionalDateSchema(),
  })
  .strict();

export const servicoOperacaoSchema = z
  .object({
    competencia: requiredCompetenciaSchema(),
    dataPrestacaoServico: requiredDateSchema(),
    descricaoServico: requiredTextSchema(),
    codigoServicoMunicipal: requiredTextSchema(),
    itemListaServico: optionalTextSchema(),
    codigoCnae: optionalTextSchema(),
    codigoNbs: optionalTextSchema(),
    observacoes: optionalTextSchema(),
    informacoesComplementares: optionalTextSchema(),
  })
  .strict();

export const localPrestacaoSchema = z
  .object({
    paisPrestacao: optionalTextSchema(),
    municipioPrestacao: requiredTextSchema(),
    ufPrestacao: optionalUfSchema(),
    municipioIncidencia: optionalTextSchema(),
    localServico: requiredTextSchema(),
  })
  .strict();

export const tributacaoEntradaSchema = z
  .object({
    valorServicos: requiredDecimalSchema(),
    valorDeducoes: optionalDecimalSchema(),
    descontoIncondicionado: optionalDecimalSchema(),
    descontoCondicionado: optionalDecimalSchema(),
    valorRetencaoPis: optionalDecimalSchema(),
    valorRetencaoCofins: optionalDecimalSchema(),
    valorRetencaoCsll: optionalDecimalSchema(),
    irrfValorImposto: optionalDecimalSchema(),
    inssCpIm: optionalDecimalSchema(),
    contribuicoesSociaisRetidas: optionalDecimalSchema(),
    issRetido: optionalBooleanSchema(),
    issqnAliquota: optionalDecimalSchema(),
    issqnCasoImunidadeExportacaoNaoIncidencia: optionalTextSchema(),
  })
  .strict();

export const workflowSnapshotSchema = z
  .object({
    workflowStatus: workflowStatusSchema,
    preValidadoAt: optionalDateSchema(),
    previaGeradaAt: optionalDateSchema(),
    aguardandoAprovacaoAt: optionalDateSchema(),
    aprovadoClienteAt: optionalDateSchema(),
    enviadoEmissaoAt: optionalDateSchema(),
    autorizadoAt: optionalDateSchema(),
    rejeitadoAt: optionalDateSchema(),
    canceladoAt: optionalDateSchema(),
  })
  .strict();

export const previaCalculadaSchema = z
  .object({
    baseCalculo: optionalDecimalSchema(),
    aliquotaAplicada: optionalDecimalSchema(),
    valorIssqn: optionalDecimalSchema(),
    valorLiquidoNfse: optionalDecimalSchema(),
    valorTotalNfse: optionalDecimalSchema(),
    situacaoTributaria: optionalTextSchema(),
    pisCofinsCsllSituacao: optionalTextSchema(),
    totalTributos: optionalDecimalSchema(),
    totalTributosFederais: optionalDecimalSchema(),
    totalTributosEstaduais: optionalDecimalSchema(),
    totalTributosMunicipais: optionalDecimalSchema(),
    issValorImpostoRetido: optionalDecimalSchema(),
    pisDebitoApuracaoPropria: optionalDecimalSchema(),
    cofinsDebitoApuracaoPropria: optionalDecimalSchema(),
    irrfRetidoNaFonte: optionalDecimalSchema(),
    snapshotJson: optionalJsonSchema(),
  })
  .strict();

export const emissaoOficialSchema = z
  .object({
    numeroNfse: optionalTextSchema(),
    serieNfse: optionalTextSchema(),
    chaveAcessoNfse: optionalTextSchema(),
    codigoVerificacao: optionalTextSchema(),
    dataHoraEmissaoNfse: optionalDateSchema(),
    dataHoraEmissaoDps: optionalDateSchema(),
    protocoloAutorizacao: optionalTextSchema(),
    dataAutorizacao: optionalDateSchema(),
    linkDanfse: optionalTextSchema(),
    payloadRetornoProvedor: optionalJsonSchema(),
    jsonAutorizado: optionalJsonSchema(),
    xmlAutorizado: optionalTextSchema(),
  })
  .strict();

export {
  requiredTextSchema,
  optionalTextSchema,
  optionalEmailSchema,
  requiredDocumentSchema,
  optionalDocumentSchema,
  requiredCepSchema,
  optionalCepSchema,
  optionalPhoneSchema,
  requiredUfSchema,
  optionalUfSchema,
  requiredDateSchema,
  optionalDateSchema,
  requiredDecimalSchema,
  optionalDecimalSchema,
  optionalBooleanSchema,
  requiredCompetenciaSchema,
};
