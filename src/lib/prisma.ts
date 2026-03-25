import type { PrismaRascunhoNfseClient } from "../application/nfse/rascunho-nfse.service";

const unavailablePrisma = new Proxy(
  {},
  {
    get() {
      throw new Error(
        "Prisma nao esta disponivel neste host local. Use o adapter de persistencia do MVP.",
      );
    },
  },
) as PrismaRascunhoNfseClient;

export const prisma = unavailablePrisma;
