import { z } from "zod";

import {
  emissaoOficialSchema,
  statusAutorizacaoSchema,
} from "./_shared";
import { NfsePreviaCalculadaBaseSchema } from "./previa-nfse.schema";

export const NfseAutorizadaBaseSchema = z
  .object({
    ...NfsePreviaCalculadaBaseSchema.shape,
    ...emissaoOficialSchema.shape,
  })
  .strict();

export const NfseAutorizadaSchema = NfseAutorizadaBaseSchema.extend({
  statusAutorizacao: statusAutorizacaoSchema,
})
  .strict();

export type NfseAutorizada = z.infer<typeof NfseAutorizadaSchema>;
