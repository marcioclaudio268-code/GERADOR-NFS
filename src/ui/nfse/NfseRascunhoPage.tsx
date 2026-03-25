import React, { useEffect, useState, type ChangeEvent } from "react";
import { z } from "zod";

import { canEditNfseDraft } from "../../domain/nfse/editability";
import type { WorkflowStatus } from "../../domain/nfse/status";
import { prestadorSnapshotSchema } from "../../schemas/nfse/_shared";
import { NfsePreviaCalculadaSchema } from "../../schemas/nfse/previa-nfse.schema";
import {
  RascunhoNfseInputSchema,
  type RascunhoNfseInput,
} from "../../schemas/nfse/rascunho-nfse.schema";

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

export type NfseRascunhoActions = {
  buscarRascunho: (args: { rascunhoId: string }) => Promise<RascunhoNfseResultado | null>;
  salvarOuAtualizar: (args: {
    rascunhoId?: string;
    input: RascunhoNfseInput;
    prestador: PrestadorNfseSnapshot;
  }) => Promise<RascunhoNfseResultado>;
  aprovar: (args: { rascunhoId: string }) => Promise<RascunhoNfseResultado>;
  reprovar: (args: {
    rascunhoId: string;
    observacaoValidacaoCliente: string;
  }) => Promise<RascunhoNfseResultado>;
};

type FieldKind = "text" | "textarea" | "date" | "decimal" | "boolean" | "email" | "tel";

type FieldConfig = {
  key: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  helper?: string;
};

type FieldGroup = {
  title: string;
  description?: string;
  fields: FieldConfig[];
};

type DraftFormState = Record<string, string>;

export type NfseRascunhoPageProps = {
  rascunhoId?: string;
  prestador: PrestadorNfseSnapshot;
  initialResultado?: RascunhoNfseResultado | null;
  actions: NfseRascunhoActions;
};

const DRAFT_FIELD_GROUPS: FieldGroup[] = [
  {
    title: "Controle operacional",
    fields: [
      { key: "tomadorLocalizacao", label: "Localização do tomador", kind: "text" },
      { key: "intermediarioLocalizacao", label: "Localização do intermediário", kind: "text" },
    ],
  },
  {
    title: "Tomador",
    fields: [
      { key: "tomadorDocumento", label: "Documento", kind: "text" },
      { key: "tomadorRazaoSocial", label: "Razão social", kind: "text" },
      { key: "tomadorNomeFantasia", label: "Nome fantasia", kind: "text" },
      { key: "tomadorEmail", label: "E-mail", kind: "email" },
      { key: "tomadorTelefone", label: "Telefone", kind: "tel" },
      { key: "tomadorInscricaoMunicipal", label: "Inscrição municipal", kind: "text" },
      { key: "tomadorInscricaoEstadual", label: "Inscrição estadual", kind: "text" },
      { key: "tomadorEndereco", label: "Endereço", kind: "text" },
      { key: "tomadorMunicipio", label: "Município", kind: "text" },
      { key: "tomadorUf", label: "UF", kind: "text" },
      { key: "tomadorCep", label: "CEP", kind: "text" },
    ],
  },
  {
    title: "Intermediário",
    fields: [
      { key: "intermediarioDocumento", label: "Documento", kind: "text" },
      { key: "intermediarioRazaoSocial", label: "Razão social", kind: "text" },
      { key: "intermediarioInscricaoMunicipal", label: "Inscrição municipal", kind: "text" },
      { key: "intermediarioEmail", label: "E-mail", kind: "email" },
      { key: "intermediarioTelefone", label: "Telefone", kind: "tel" },
      { key: "intermediarioEndereco", label: "Endereço", kind: "text" },
      { key: "intermediarioMunicipio", label: "Município", kind: "text" },
      { key: "intermediarioUf", label: "UF", kind: "text" },
      { key: "intermediarioCep", label: "CEP", kind: "text" },
    ],
  },
  {
    title: "RPS / DPS",
    fields: [
      { key: "numeroRps", label: "Número do RPS", kind: "text" },
      { key: "serieRps", label: "Série do RPS", kind: "text" },
      { key: "dataEmissaoRps", label: "Data de emissão do RPS", kind: "date" },
    ],
  },
  {
    title: "Serviço / operação",
    fields: [
      { key: "competencia", label: "Competência", kind: "text", required: true, helper: "Formato recomendado: AAAA-MM." },
      { key: "dataPrestacaoServico", label: "Data da prestação", kind: "date", required: true },
      { key: "descricaoServico", label: "Descrição do serviço", kind: "textarea", required: true },
      { key: "codigoServicoMunicipal", label: "Código do serviço municipal", kind: "text", required: true },
      { key: "itemListaServico", label: "Item da lista de serviço", kind: "text" },
      { key: "codigoCnae", label: "Código CNAE", kind: "text" },
      { key: "codigoNbs", label: "Código NBS", kind: "text" },
      { key: "observacoes", label: "Observações", kind: "textarea" },
      { key: "informacoesComplementares", label: "Informações complementares", kind: "textarea" },
    ],
  },
  {
    title: "Local da prestação",
    fields: [
      { key: "paisPrestacao", label: "País", kind: "text" },
      { key: "municipioPrestacao", label: "Município de prestação", kind: "text", required: true },
      { key: "ufPrestacao", label: "UF", kind: "text" },
      { key: "municipioIncidencia", label: "Município de incidência", kind: "text" },
      { key: "localServico", label: "Local do serviço", kind: "text", required: true },
    ],
  },
  {
    title: "Tributação / entrada",
    fields: [
      { key: "valorServicos", label: "Valor dos serviços", kind: "decimal", required: true },
      { key: "valorDeducoes", label: "Valor de deduções", kind: "decimal" },
      { key: "descontoIncondicionado", label: "Desconto incondicionado", kind: "decimal" },
      { key: "descontoCondicionado", label: "Desconto condicionado", kind: "decimal" },
      { key: "valorRetencaoPis", label: "Retenção de PIS", kind: "decimal" },
      { key: "valorRetencaoCofins", label: "Retenção de COFINS", kind: "decimal" },
      { key: "valorRetencaoCsll", label: "Retenção de CSLL", kind: "decimal" },
      { key: "irrfValorImposto", label: "IRRF", kind: "decimal" },
      { key: "inssCpIm", label: "INSS/CP", kind: "decimal" },
      { key: "contribuicoesSociaisRetidas", label: "Contribuições sociais retidas", kind: "decimal" },
      { key: "issRetido", label: "ISS retido", kind: "boolean" },
      { key: "issqnAliquota", label: "Alíquota ISSQN", kind: "decimal" },
      {
        key: "issqnCasoImunidadeExportacaoNaoIncidencia",
        label: "Caso de imunidade / exportação / não incidência",
        kind: "text",
      },
    ],
  },
];

const FIELD_KEYS = DRAFT_FIELD_GROUPS.reduce<string[]>((keys, group) => {
  for (const field of group.fields) {
    keys.push(field.key);
  }

  return keys;
}, []);

const PREVIEW_NUMBER_FORMAT = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function createEmptyFormState(): DraftFormState {
  return FIELD_KEYS.reduce<DraftFormState>((acc, key) => {
    acc[key] = "";
    return acc;
  }, {});
}

function toFormValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return String(value);
}

function buildFormStateFromResult(resultado: RascunhoNfseResultado | null): DraftFormState {
  const state = createEmptyFormState();
  const draft = resultado?.draft;

  if (!draft) {
    return state;
  }

  for (const key of FIELD_KEYS) {
    state[key] = toFormValue((draft as Record<string, unknown>)[key]);
  }

  return state;
}

function formatDateTime(value: unknown): string {
  if (!(value instanceof Date)) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

function formatPreviewValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "Pendente";
  }

  if (typeof value === "number") {
    return PREVIEW_NUMBER_FORMAT.format(value);
  }

  return String(value);
}

function formatWorkflowStatus(status: string): string {
  const map: Record<string, string> = {
    RASCUNHO: "Rascunho",
    PRE_VALIDACAO: "Pré-validação",
    PREVIA_GERADA: "Prévia gerada",
    AGUARDANDO_APROVACAO_CLIENTE: "Aguardando aprovação do cliente",
    APROVADO_CLIENTE: "Aprovado pelo cliente",
    EM_PROCESSAMENTO: "Em processamento",
    AUTORIZADA: "Autorizada",
    REJEITADA: "Rejeitada",
    CANCELADA: "Cancelada",
  };

  return map[status] ?? status;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Não foi possível concluir a operação.";
}

function renderField(
  field: FieldConfig,
  value: string,
  onChange: (value: string) => void,
  disabled: boolean,
) {
  const commonProps = {
    id: field.key,
    name: field.key,
    value,
    disabled,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      onChange(event.target.value),
    style: {
      width: "100%",
      padding: "0.65rem 0.75rem",
      border: "1px solid #cbd5e1",
      borderRadius: 6,
      background: disabled ? "#f8fafc" : "#ffffff",
    },
  } as const;

  if (field.kind === "textarea") {
    return <textarea {...commonProps} rows={4} />;
  }

  if (field.kind === "boolean") {
    return (
      <select {...commonProps}>
        <option value="">Não informado</option>
        <option value="true">Sim</option>
        <option value="false">Não</option>
      </select>
    );
  }

  return (
    <input
      {...commonProps}
      type={field.kind === "date" ? "date" : field.kind === "email" ? "email" : field.kind === "tel" ? "tel" : "text"}
      inputMode={field.kind === "decimal" ? "decimal" : undefined}
    />
  );
}

function renderPreviewSection(resultado: RascunhoNfseResultado | null) {
  const preview = resultado?.preview;

  if (!preview) {
    return <p>Salve o rascunho para gerar a prévia de conferência.</p>;
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <dl style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <div>
          <dt>Base de cálculo</dt>
          <dd>{formatPreviewValue(preview.baseCalculo)}</dd>
        </div>
        <div>
          <dt>Alíquota aplicada</dt>
          <dd>{formatPreviewValue(preview.aliquotaAplicada)}</dd>
        </div>
        <div>
          <dt>Valor ISSQN</dt>
          <dd>{formatPreviewValue(preview.valorIssqn)}</dd>
        </div>
        <div>
          <dt>Valor líquido da NFSe</dt>
          <dd>{formatPreviewValue(preview.valorLiquidoNfse)}</dd>
        </div>
        <div>
          <dt>Valor total da NFSe</dt>
          <dd>{formatPreviewValue(preview.valorTotalNfse)}</dd>
        </div>
      </dl>

      <details>
        <summary>Snapshot técnico da prévia</summary>
        <pre style={{ whiteSpace: "pre-wrap", marginTop: 12 }}>
          {JSON.stringify(preview.snapshotJson ?? null, null, 2)}
        </pre>
      </details>
    </div>
  );
}

function renderPrestadorSnapshot(resultado: RascunhoNfseResultado | null, prestador: PrestadorNfseSnapshot) {
  const snapshot = resultado?.draft ?? prestador;

  return (
    <dl style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
      <div>
        <dt>Documento</dt>
        <dd>{snapshot.prestadorDocumento}</dd>
      </div>
      <div>
        <dt>Razão social</dt>
        <dd>{snapshot.prestadorRazaoSocial}</dd>
      </div>
      <div>
        <dt>Nome fantasia</dt>
        <dd>{snapshot.prestadorNomeFantasia ?? "-"}</dd>
      </div>
      <div>
        <dt>Inscrição municipal</dt>
        <dd>{snapshot.prestadorInscricaoMunicipal}</dd>
      </div>
      <div>
        <dt>Inscrição estadual</dt>
        <dd>{snapshot.prestadorInscricaoEstadual ?? "-"}</dd>
      </div>
      <div>
        <dt>E-mail</dt>
        <dd>{snapshot.prestadorEmail ?? "-"}</dd>
      </div>
      <div>
        <dt>Telefone</dt>
        <dd>{snapshot.prestadorTelefone ?? "-"}</dd>
      </div>
    </dl>
  );
}

export function NfseRascunhoPage({
  rascunhoId,
  prestador,
  initialResultado = null,
  actions,
}: NfseRascunhoPageProps) {
  const [resultado, setResultado] = useState<RascunhoNfseResultado | null>(initialResultado);
  const [formState, setFormState] = useState<DraftFormState>(
    buildFormStateFromResult(initialResultado),
  );
  const [reprovacaoObservacao, setReprovacaoObservacao] = useState(
    initialResultado?.draft.observacaoValidacaoCliente ?? "",
  );
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      if (!rascunhoId) {
        if (ativo) {
          setResultado(initialResultado);
          setFormState(buildFormStateFromResult(initialResultado));
          setReprovacaoObservacao(initialResultado?.draft.observacaoValidacaoCliente ?? "");
        }
        return;
      }

      if (initialResultado) {
        if (ativo) {
          setResultado(initialResultado);
          setFormState(buildFormStateFromResult(initialResultado));
          setReprovacaoObservacao(initialResultado.draft.observacaoValidacaoCliente ?? "");
        }
        return;
      }

      setCarregando(true);
      setErro(null);
      try {
        const carregado = await actions.buscarRascunho({ rascunhoId });
        if (!ativo) {
          return;
        }

        if (!carregado) {
          setResultado(null);
          setFormState(createEmptyFormState());
          setReprovacaoObservacao("");
          setErro(`Rascunho NFSe nao encontrado: ${rascunhoId}.`);
          return;
        }

        setResultado(carregado);
        setFormState(buildFormStateFromResult(carregado));
        setReprovacaoObservacao(carregado?.draft.observacaoValidacaoCliente ?? "");
      } catch (error) {
        if (ativo) {
          setErro(getErrorMessage(error));
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    void carregar();

    return () => {
      ativo = false;
    };
  }, [initialResultado, rascunhoId]);

  const statusAtual = resultado?.workflowStatus ?? "RASCUNHO";
  const podeEditar = canEditNfseDraft(statusAtual as Parameters<typeof canEditNfseDraft>[0]);
  const aguardandoAprovacao = statusAtual === "AGUARDANDO_APROVACAO_CLIENTE";
  const reprovado = statusAtual === "REJEITADA";

  async function salvarDraft() {
    setSalvando(true);
    setErro(null);

    try {
      const parsed = RascunhoNfseInputSchema.parse(formState);
      const salvo = await actions.salvarOuAtualizar({
        rascunhoId: resultado?.rascunhoId,
        input: parsed,
        prestador,
      });

      setResultado(salvo);
      setFormState(buildFormStateFromResult(salvo));
      setReprovacaoObservacao(salvo.draft.observacaoValidacaoCliente ?? "");
    } catch (error) {
      setErro(getErrorMessage(error));
    } finally {
      setSalvando(false);
    }
  }

  async function aprovarCliente() {
    if (!resultado?.rascunhoId) {
      return;
    }

    setSalvando(true);
    setErro(null);

    try {
      const atualizado = await actions.aprovar({
        rascunhoId: resultado.rascunhoId,
      });

      setResultado(atualizado);
      setFormState(buildFormStateFromResult(atualizado));
      setReprovacaoObservacao("");
    } catch (error) {
      setErro(getErrorMessage(error));
    } finally {
      setSalvando(false);
    }
  }

  async function reprovarCliente() {
    if (!resultado?.rascunhoId) {
      return;
    }

    const observacao = reprovacaoObservacao.trim();
    if (!observacao) {
      setErro("Informe uma observação para a reprovação.");
      return;
    }

    setSalvando(true);
    setErro(null);

    try {
      const atualizado = await actions.reprovar({
        rascunhoId: resultado.rascunhoId,
        observacaoValidacaoCliente: observacao,
      });

      setResultado(atualizado);
      setFormState(buildFormStateFromResult(atualizado));
      setReprovacaoObservacao(atualizado.draft.observacaoValidacaoCliente ?? observacao);
    } catch (error) {
      setErro(getErrorMessage(error));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 16, padding: 16, maxWidth: 1280, margin: "0 auto" }}>
      <header style={{ display: "grid", gap: 8 }}>
        <h1 style={{ margin: 0 }}>Rascunho de NFSe</h1>
        <p style={{ margin: 0 }}>
          Fluxo visível do rascunho, com edição, prévia e validação do cliente.
        </p>
      </header>

      {carregando ? <p>Carregando rascunho...</p> : null}
      {erro ? (
        <div style={{ border: "1px solid #fecaca", background: "#fef2f2", padding: 12, borderRadius: 8 }}>
          {erro}
        </div>
      ) : null}

      <section style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: 16, background: "#fff" }}>
        <h2 style={{ marginTop: 0 }}>Workflow</h2>
        <p style={{ marginTop: 0 }}>Status atual: <strong>{formatWorkflowStatus(statusAtual)}</strong></p>
        <div style={{ display: "grid", gap: 8 }}>
          <div>Pré-validado em: {formatDateTime(resultado?.draft.preValidadoAt)}</div>
          <div>Prévia gerada em: {formatDateTime(resultado?.draft.previaGeradaAt)}</div>
          <div>Aguardando aprovação em: {formatDateTime(resultado?.draft.aguardandoAprovacaoAt)}</div>
          <div>Aprovado pelo cliente em: {formatDateTime(resultado?.draft.aprovadoClienteAt)}</div>
          <div>Rejeitado em: {formatDateTime(resultado?.draft.rejeitadoAt)}</div>
          {resultado?.draft.observacaoValidacaoCliente ? (
            <div style={{ color: "#991b1b" }}>
              Observação da reprovação: {resultado.draft.observacaoValidacaoCliente}
            </div>
          ) : null}
        </div>
      </section>

      <section style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: 16, background: "#fff" }}>
        <h2 style={{ marginTop: 0 }}>Prestador snapshot</h2>
        {renderPrestadorSnapshot(resultado, prestador)}
      </section>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void salvarDraft();
        }}
        style={{ display: "grid", gap: 16 }}
      >
        {DRAFT_FIELD_GROUPS.map((group) => (
          <section key={group.title} style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: 16, background: "#fff" }}>
            <h2 style={{ marginTop: 0 }}>{group.title}</h2>
            {group.description ? <p>{group.description}</p> : null}
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
              {group.fields.map((field) => {
                const value = formState[field.key] ?? "";
                return (
                  <label key={field.key} style={{ display: "grid", gap: 6 }}>
                    <span>
                      {field.label}
                      {field.required ? " *" : ""}
                    </span>
                    {renderField(
                      field,
                      value,
                      (nextValue) => setFormState((current) => ({ ...current, [field.key]: nextValue })),
                      !podeEditar,
                    )}
                    {field.helper ? <small>{field.helper}</small> : null}
                  </label>
                );
              })}
            </div>
          </section>
        ))}

        <section style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: 16, background: "#fff" }}>
          <h2 style={{ marginTop: 0 }}>Prévia para conferência</h2>
          {renderPreviewSection(resultado)}
        </section>

        <section style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: 16, background: "#fff" }}>
          <h2 style={{ marginTop: 0 }}>Validação do cliente</h2>
          <p style={{ marginTop: 0 }}>
            {aguardandoAprovacao
              ? "O rascunho está pronto para aprovação ou reprovação."
              : reprovado
              ? "O rascunho foi reprovado e pode ser editado novamente."
              : "Salve o rascunho para avançar ao estado de validação do cliente."}
          </p>

          <div style={{ display: "grid", gap: 12 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span>Observação da reprovação</span>
              <textarea
                rows={4}
                value={reprovacaoObservacao}
                onChange={(event) => setReprovacaoObservacao(event.target.value)}
                disabled={!aguardandoAprovacao}
                style={{
                  width: "100%",
                  padding: "0.65rem 0.75rem",
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  background: aguardandoAprovacao ? "#ffffff" : "#f8fafc",
                }}
              />
            </label>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="submit" disabled={salvando || !podeEditar}>
                {salvando ? "Salvando..." : "Salvar e enviar para aprovação"}
              </button>
              <button type="button" onClick={() => void aprovarCliente()} disabled={salvando || !aguardandoAprovacao}>
                Aprovar cliente
              </button>
              <button type="button" onClick={() => void reprovarCliente()} disabled={salvando || !aguardandoAprovacao}>
                Reprovar com observação
              </button>
            </div>
          </div>
        </section>
      </form>
    </div>
  );
}
