import { Hono } from "hono"

import { transactionOfferRoutes } from "./routes-offers.js"
import { transactionOrderRoutes } from "./routes-orders.js"
import type { Env } from "./routes-shared.js"

export const transactionsRoutes = new Hono<Env>()
transactionsRoutes.route("/", transactionOfferRoutes)
transactionsRoutes.route("/", transactionOrderRoutes)

export type TransactionsRoutes = typeof transactionsRoutes
