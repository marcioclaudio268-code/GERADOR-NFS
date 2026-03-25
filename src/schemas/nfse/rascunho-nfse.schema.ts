import { z } from "zod";

import {
  controleOperacionalSchema,
  localPrestacaoSchema,
  normalizeRascunhoNfseInput,
  rpsDpsSchema,
  servicoOperacaoSchema,
  tomadorSchema,
  intermediarioSchema,
  tributacaoEntradaSchema,
} from "./_shared";

export const rascunhoNfseDraftSchema = z
  .object({
    ...controleOperacionalSchema.shape,
    ...tomadorSchema.shape,
    ...intermediarioSchema.shape,
    ...rpsDpsSchema.shape,
    ...servicoOperacaoSchema.shape,
    ...localPrestacaoSchema.shape,
    ...tributacaoEntradaSchema.shape,
  })
  .strict();

export const RascunhoNfseInputSchema = z.preprocess(
  normalizeRascunhoNfseInput,
  rascunhoNfseDraftSchema,
);

export const rascunhoNfseSchema = RascunhoNfseInputSchema;

export type RascunhoNfseInput = z.infer<typeof RascunhoNfseInputSchema>;
export type RascunhoNfse = z.infer<typeof RascunhoNfseInputSchema>;
