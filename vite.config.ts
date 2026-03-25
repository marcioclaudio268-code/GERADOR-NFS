import type { IncomingMessage, ServerResponse } from "node:http";

import { defineConfig, type Plugin } from "vite";

import {
  aprovarRascunhoNfseAction,
  buscarRascunhoNfseAction,
  reprovarRascunhoNfseAction,
  salvarOuAtualizarRascunhoNfseAction,
} from "./src/application/nfse/rascunho-nfse.service";
import { createLocalNfsePrismaAdapter } from "./src/server/nfse/local-prisma-adapter";

const API_PREFIX = "/api/nfse/rascunho";

function sendJson(res: ServerResponse, statusCode: number, body: unknown): void {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    req.on("data", (chunk) => {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    });

    req.on("end", () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }

      const raw = Buffer.concat(chunks).toString("utf8").trim();
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw) as unknown);
      } catch (error) {
        reject(error);
      }
    });

    req.on("error", reject);
  });
}

function createNfseApiPlugin(): Plugin {
  const prisma = createLocalNfsePrismaAdapter();

  const handleRequest = async (
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<boolean> => {
    const url = new URL(req.url ?? "", "http://localhost");

    if (!url.pathname.startsWith(API_PREFIX)) {
      return false;
    }

    try {
      if (req.method === "GET" && url.pathname.startsWith(`${API_PREFIX}/`)) {
        const pathnameTail = url.pathname.slice(`${API_PREFIX}/`.length);
        const [rascunhoId] = pathnameTail.split("/");

        if (!rascunhoId) {
          sendJson(res, 400, { error: "Rascunho NFSe nao informado." });
          return true;
        }

        const resultado = await buscarRascunhoNfseAction({
          rascunhoId: decodeURIComponent(rascunhoId),
          prisma,
        });

        if (!resultado) {
          sendJson(res, 404, { error: "Rascunho NFSe nao encontrado." });
          return true;
        }

        sendJson(res, 200, resultado);
        return true;
      }

      if (req.method === "POST" && url.pathname === API_PREFIX) {
        const body = (await readJsonBody(req)) as {
          rascunhoId?: string;
          input?: unknown;
          prestador?: unknown;
        };

        const resultado = await salvarOuAtualizarRascunhoNfseAction({
          rascunhoId: body.rascunhoId,
          input: body.input,
          prestador: body.prestador,
          prisma,
        });

        sendJson(res, 200, resultado);
        return true;
      }

      if (req.method === "POST" && url.pathname.startsWith(`${API_PREFIX}/`) && url.pathname.endsWith("/aprovar")) {
        const pathnameTail = url.pathname.slice(`${API_PREFIX}/`.length);
        const [rascunhoId] = pathnameTail.split("/");

        if (!rascunhoId) {
          sendJson(res, 400, { error: "Rascunho NFSe nao informado." });
          return true;
        }

        const resultado = await aprovarRascunhoNfseAction({
          rascunhoId: decodeURIComponent(rascunhoId),
          prisma,
        });

        sendJson(res, 200, resultado);
        return true;
      }

      if (req.method === "POST" && url.pathname.startsWith(`${API_PREFIX}/`) && url.pathname.endsWith("/reprovar")) {
        const pathnameTail = url.pathname.slice(`${API_PREFIX}/`.length);
        const [rascunhoId] = pathnameTail.split("/");

        if (!rascunhoId) {
          sendJson(res, 400, { error: "Rascunho NFSe nao informado." });
          return true;
        }

        const body = (await readJsonBody(req)) as {
          observacaoValidacaoCliente?: string;
        };

        const resultado = await reprovarRascunhoNfseAction({
          rascunhoId: decodeURIComponent(rascunhoId),
          observacaoValidacaoCliente: body.observacaoValidacaoCliente ?? "",
          prisma,
        });

        sendJson(res, 200, resultado);
        return true;
      }

      sendJson(res, 405, { error: "Metodo nao suportado." });
      return true;
    } catch (error) {
      sendJson(res, 400, {
        error: error instanceof Error ? error.message : "Falha ao processar a operacao.",
      });
      return true;
    }
  };

  return {
    name: "nfse-local-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const handled = await handleRequest(req, res);
        if (!handled) {
          next();
        }
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const handled = await handleRequest(req, res);
        if (!handled) {
          next();
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [createNfseApiPlugin()],
});
