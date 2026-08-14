import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth";

/**
 * @swagger
 * /api/auth/{all}:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Catch-all HTTP do Better Auth
 *     description: >
 *       Sessão, callback OAuth e demais handlers GET gerenciados pelo
 *       Better Auth (`toNextJsHandler`). Detalhes internos do protocolo
 *       não são enumerados aqui.
 *     parameters:
 *       - in: path
 *         name: all
 *         required: true
 *         schema:
 *           type: string
 *         description: Subcaminho do Better Auth (ex. get-session, callback/google)
 *     responses:
 *       200:
 *         description: Resposta do Better Auth
 *   post:
 *     tags:
 *       - Auth
 *     summary: Catch-all HTTP do Better Auth
 *     description: >
 *       Login, cadastro, reset de senha e demais handlers POST gerenciados
 *       pelo Better Auth. Payloads e cookies de sessão seguem o contrato
 *       da biblioteca — não reimplementar nem espelhar aqui.
 *     parameters:
 *       - in: path
 *         name: all
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resposta do Better Auth
 */
export const { GET, POST } = toNextJsHandler(auth);
