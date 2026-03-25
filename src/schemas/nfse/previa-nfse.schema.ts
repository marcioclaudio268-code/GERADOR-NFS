import { z } from "zod";

import {
  prestadorSnapshotSchema,
  previaCalculadaSchema,
  workflowSnapshotSchema,
} from "./_shared";
import { rascunhoNfseDraftSchema } from "./rascunho-nfse.schema";

export const NfsePreviaCalculadaBaseSchema = z
  .object({
    ...workflowSnapshotSchema.shape,
    ...prestadorSnapshotSchema.shape,
    ...rascunhoNfseDraftSchema.shape,
    ...previaCalculadaSchema.shape,
  })
  .strict();

export const NfsePreviaCalculadaSchema = NfsePreviaCalculadaBaseSchema;

export type NfsePreviaCalculada = z.infer<typeof NfsePreviaCalculadaSchema>;
