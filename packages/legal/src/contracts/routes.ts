import type { EventBus, ModuleContainer } from "@voyantjs/core"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono } from "hono"

import {
  buildContractsRouteRuntime,
  CONTRACTS_ROUTE_RUNTIME_CONTAINER_KEY,
  type ContractsRouteRuntime,
} from "./route-runtime.js"
import { contractsService } from "./service.js"
import {
  contractListQuerySchema,
  contractTemplateDefaultQuerySchema,
  contractTemplateListQuerySchema,
  generateContractDocumentInputSchema,
  insertContractAttachmentSchema,
  insertContractNumberSeriesSchema,
  insertContractSchema,
  insertContractSignatureSchema,
  insertContractTemplateSchema,
  insertContractTemplateVersionSchema,
  publicRenderTemplatePreviewInputSchema,
  renderTemplateInputSchema,
  updateContractAttachmentSchema,
  updateContractNumberSeriesSchema,
  updateContractSchema,
  updateContractTemplateSchema,
} from "./validation.js"

type Env = {
  Bindings: Record<string, unknown>
  Variables: {
    container: ModuleContainer
    db: PostgresJsDatabase
    userId?: string
  }
}

export type ContractDocumentGenerator = Parameters<
  typeof contractsService.generateContractDocument
>[3]["generator"]

export interface ContractsRouteOptions {
  documentGenerator?: ContractDocumentGenerator
  resolveDocumentGenerator?: (
    bindings: Record<string, unknown>,
  ) => ContractDocumentGenerator | undefined
  eventBus?: EventBus
  resolveEventBus?: (bindings: Record<string, unknown>) => EventBus | undefined
}

function getRuntime(
  options: ContractsRouteOptions | undefined,
  bindings: Record<string, unknown>,
  resolveFromContainer?: (key: string) => ContractsRouteRuntime | undefined,
) {
  return (
    resolveFromContainer?.(CONTRACTS_ROUTE_RUNTIME_CONTAINER_KEY) ??
    buildContractsRouteRuntime(bindings, options)
  )
}

export function createContractsAdminRoutes(options: ContractsRouteOptions = {}) {
  return new Hono<Env>()
    .get("/templates", async (c) => {
      const query = contractTemplateListQuerySchema.parse(
        Object.fromEntries(new URL(c.req.url).searchParams),
      )
      return c.json(await contractsService.listTemplates(c.get("db"), query))
    })
    .get("/templates/default", async (c) => {
      const query = contractTemplateDefaultQuerySchema.parse(
        Object.fromEntries(new URL(c.req.url).searchParams),
      )
      const row = await contractsService.getDefaultTemplate(c.get("db"), query)
      if (!row) return c.json({ error: "Template not found" }, 404)
      return c.json({ data: row })
    })
    .post("/templates", async (c) => {
      const row = await contractsService.createTemplate(
        c.get("db"),
        insertContractTemplateSchema.parse(await c.req.json()),
      )
      return c.json({ data: row }, 201)
    })
    .get("/templates/:id", async (c) => {
      const row = await contractsService.getTemplateById(c.get("db"), c.req.param("id"))
      if (!row) return c.json({ error: "Template not found" }, 404)
      return c.json({ data: row })
    })
    .patch("/templates/:id", async (c) => {
      const row = await contractsService.updateTemplate(
        c.get("db"),
        c.req.param("id"),
        updateContractTemplateSchema.parse(await c.req.json()),
      )
      if (!row) return c.json({ error: "Template not found" }, 404)
      return c.json({ data: row })
    })
    .delete("/templates/:id", async (c) => {
      const row = await contractsService.deleteTemplate(c.get("db"), c.req.param("id"))
      if (!row) return c.json({ error: "Template not found" }, 404)
      return c.json({ success: true })
    })
    .post("/templates/:id/preview", async (c) => {
      const input = renderTemplateInputSchema.parse(await c.req.json())
      const template = await contractsService.getTemplateById(c.get("db"), c.req.param("id"))
      if (!template) return c.json({ error: "Template not found" }, 404)
      const body = input.body ?? template.body
      const bodyFormat = input.bodyFormat ?? template.bodyFormat
      const rendered = contractsService.renderPreview({ ...input, body, bodyFormat })
      return c.json({ data: { rendered, bodyFormat } })
    })
    .get("/templates/:id/versions", async (c) => {
      const rows = await contractsService.listTemplateVersions(c.get("db"), c.req.param("id"))
      return c.json({ data: rows })
    })
    .post("/templates/:id/versions", async (c) => {
      const version = await contractsService.createTemplateVersion(
        c.get("db"),
        c.req.param("id"),
        insertContractTemplateVersionSchema.parse(await c.req.json()),
      )
      if (!version) return c.json({ error: "Template not found" }, 404)
      return c.json({ data: version }, 201)
    })
    .get("/template-versions/:id", async (c) => {
      const row = await contractsService.getTemplateVersionById(c.get("db"), c.req.param("id"))
      if (!row) return c.json({ error: "Template version not found" }, 404)
      return c.json({ data: row })
    })
    .get("/number-series", async (c) => {
      const rows = await contractsService.listSeries(c.get("db"))
      return c.json({ data: rows })
    })
    .post("/number-series", async (c) => {
      const row = await contractsService.createSeries(
        c.get("db"),
        insertContractNumberSeriesSchema.parse(await c.req.json()),
      )
      return c.json({ data: row }, 201)
    })
    .get("/number-series/:id", async (c) => {
      const row = await contractsService.getSeriesById(c.get("db"), c.req.param("id"))
      if (!row) return c.json({ error: "Series not found" }, 404)
      return c.json({ data: row })
    })
    .patch("/number-series/:id", async (c) => {
      const row = await contractsService.updateSeries(
        c.get("db"),
        c.req.param("id"),
        updateContractNumberSeriesSchema.parse(await c.req.json()),
      )
      if (!row) return c.json({ error: "Series not found" }, 404)
      return c.json({ data: row })
    })
    .delete("/number-series/:id", async (c) => {
      const row = await contractsService.deleteSeries(c.get("db"), c.req.param("id"))
      if (!row) return c.json({ error: "Series not found" }, 404)
      return c.json({ success: true })
    })
    .get("/", async (c) => {
      const query = contractListQuerySchema.parse(
        Object.fromEntries(new URL(c.req.url).searchParams),
      )
      return c.json(await contractsService.listContracts(c.get("db"), query))
    })
    .post("/", async (c) => {
      const row = await contractsService.createContract(
        c.get("db"),
        insertContractSchema.parse(await c.req.json()),
      )
      return c.json({ data: row }, 201)
    })
    .get("/:id", async (c) => {
      const row = await contractsService.getContractById(c.get("db"), c.req.param("id"))
      if (!row) return c.json({ error: "Contract not found" }, 404)
      return c.json({ data: row })
    })
    .patch("/:id", async (c) => {
      const row = await contractsService.updateContract(
        c.get("db"),
        c.req.param("id"),
        updateContractSchema.parse(await c.req.json()),
      )
      if (!row) return c.json({ error: "Contract not found" }, 404)
      return c.json({ data: row })
    })
    .delete("/:id", async (c) => {
      const result = await contractsService.deleteContract(c.get("db"), c.req.param("id"))
      if (result.status === "not_found") return c.json({ error: "Contract not found" }, 404)
      if (result.status === "not_draft") {
        return c.json({ error: "Only draft contracts can be deleted" }, 409)
      }
      return c.json({ success: true })
    })
    .post("/:id/issue", async (c) => {
      const result = await contractsService.issueContract(c.get("db"), c.req.param("id"))
      if (result.status === "not_found") return c.json({ error: "Contract not found" }, 404)
      if (result.status === "not_draft") {
        return c.json({ error: "Only draft contracts can be issued" }, 409)
      }
      return c.json({ data: result.contract })
    })
    .post("/:id/send", async (c) => {
      const result = await contractsService.sendContract(c.get("db"), c.req.param("id"))
      if (result.status === "not_found") return c.json({ error: "Contract not found" }, 404)
      if (result.status === "not_issued") {
        return c.json({ error: "Only issued/sent contracts can be sent" }, 409)
      }
      return c.json({ data: result.contract })
    })
    .post("/:id/sign", async (c) => {
      const input = insertContractSignatureSchema.parse(await c.req.json())
      const result = await contractsService.signContract(c.get("db"), c.req.param("id"), input)
      if (result.status === "not_found") return c.json({ error: "Contract not found" }, 404)
      if (result.status === "not_signable") {
        return c.json({ error: "Contract is not in a signable state" }, 409)
      }
      return c.json({ data: { contract: result.contract, signature: result.signature } })
    })
    .post("/:id/execute", async (c) => {
      const result = await contractsService.executeContract(c.get("db"), c.req.param("id"))
      if (result.status === "not_found") return c.json({ error: "Contract not found" }, 404)
      if (result.status === "not_signed") {
        return c.json({ error: "Only signed contracts can be executed" }, 409)
      }
      return c.json({ data: result.contract })
    })
    .post("/:id/void", async (c) => {
      const result = await contractsService.voidContract(c.get("db"), c.req.param("id"))
      if (result.status === "not_found") return c.json({ error: "Contract not found" }, 404)
      if (result.status === "already_void") {
        return c.json({ error: "Contract is already void" }, 409)
      }
      return c.json({ data: result.contract })
    })
    .post("/:id/render", async (c) => {
      const input = renderTemplateInputSchema.parse(await c.req.json())
      const contract = await contractsService.getContractById(c.get("db"), c.req.param("id"))
      if (!contract) return c.json({ error: "Contract not found" }, 404)
      const rendered = contractsService.renderPreview(input)
      return c.json({ data: { rendered } })
    })
    .post("/:id/generate-document", async (c) => {
      const runtime = getRuntime(options, c.env, (key) => c.var.container?.resolve(key))
      const generator = runtime.documentGenerator
      if (!generator) {
        return c.json({ error: "Contract document generator is not configured" }, 501)
      }

      const result = await contractsService.generateContractDocument(
        c.get("db"),
        c.req.param("id"),
        generateContractDocumentInputSchema.parse(await c.req.json().catch(() => ({}))),
        { generator, bindings: c.env, eventBus: runtime.eventBus },
      )

      if (result.status === "not_found") return c.json({ error: "Contract not found" }, 404)
      if (result.status === "not_draft") {
        return c.json(
          { error: "Only draft contracts can be auto-issued for document generation" },
          409,
        )
      }
      if (result.status === "render_unavailable") {
        return c.json({ error: "Contract has no renderable body or template version" }, 409)
      }
      if (result.status === "generator_failed") {
        return c.json({ error: "Contract document generation failed" }, 502)
      }

      return c.json({ data: result }, 201)
    })
    .post("/:id/regenerate-document", async (c) => {
      const runtime = getRuntime(options, c.env, (key) => c.var.container?.resolve(key))
      const generator = runtime.documentGenerator
      if (!generator) {
        return c.json({ error: "Contract document generator is not configured" }, 501)
      }

      const result = await contractsService.regenerateContractDocument(
        c.get("db"),
        c.req.param("id"),
        generateContractDocumentInputSchema.parse(await c.req.json().catch(() => ({}))),
        { generator, bindings: c.env, eventBus: runtime.eventBus },
      )

      if (result.status === "not_found") return c.json({ error: "Contract not found" }, 404)
      if (result.status === "not_draft") {
        return c.json(
          { error: "Only draft contracts can be auto-issued for document generation" },
          409,
        )
      }
      if (result.status === "render_unavailable") {
        return c.json({ error: "Contract has no renderable body or template version" }, 409)
      }
      if (result.status === "generator_failed") {
        return c.json({ error: "Contract document generation failed" }, 502)
      }

      return c.json({ data: result })
    })
    .get("/:id/signatures", async (c) => {
      const rows = await contractsService.listSignatures(c.get("db"), c.req.param("id"))
      return c.json({ data: rows })
    })
    .get("/:id/attachments", async (c) => {
      const rows = await contractsService.listAttachments(c.get("db"), c.req.param("id"))
      return c.json({ data: rows })
    })
    .post("/:id/attachments", async (c) => {
      const row = await contractsService.createAttachment(
        c.get("db"),
        c.req.param("id"),
        insertContractAttachmentSchema.parse(await c.req.json()),
      )
      if (!row) return c.json({ error: "Contract not found" }, 404)
      return c.json({ data: row }, 201)
    })
    .patch("/attachments/:attachmentId", async (c) => {
      const row = await contractsService.updateAttachment(
        c.get("db"),
        c.req.param("attachmentId"),
        updateContractAttachmentSchema.parse(await c.req.json()),
      )
      if (!row) return c.json({ error: "Attachment not found" }, 404)
      return c.json({ data: row })
    })
    .delete("/attachments/:attachmentId", async (c) => {
      const row = await contractsService.deleteAttachment(c.get("db"), c.req.param("attachmentId"))
      if (!row) return c.json({ error: "Attachment not found" }, 404)
      return c.json({ success: true })
    })
}

export const contractsAdminRoutes = createContractsAdminRoutes()

export function createContractsPublicRoutes() {
  return new Hono<Env>()
    .get("/templates/default", async (c) => {
      const query = contractTemplateDefaultQuerySchema.parse(
        Object.fromEntries(new URL(c.req.url).searchParams),
      )
      const row = await contractsService.getDefaultTemplate(c.get("db"), query)
      if (!row) return c.json({ error: "Template not found" }, 404)
      return c.json({ data: row })
    })
    .post("/templates/:id/preview", async (c) => {
      const input = publicRenderTemplatePreviewInputSchema.parse(await c.req.json())
      const template = await contractsService.getTemplateById(c.get("db"), c.req.param("id"))
      if (!template?.active) return c.json({ error: "Template not found" }, 404)
      const rendered = contractsService.renderPreview({
        variables: input.variables,
        body: template.body,
        bodyFormat: template.bodyFormat,
      })
      return c.json({ data: { rendered, bodyFormat: template.bodyFormat } })
    })
    .get("/:id", async (c) => {
      const row = await contractsService.getContractById(c.get("db"), c.req.param("id"))
      if (!row) return c.json({ error: "Contract not found" }, 404)
      const { metadata: _metadata, ...publicContract } = row
      return c.json({ data: publicContract })
    })
    .post("/:id/sign", async (c) => {
      const input = insertContractSignatureSchema.parse(await c.req.json())
      const result = await contractsService.signContract(c.get("db"), c.req.param("id"), input)
      if (result.status === "not_found") return c.json({ error: "Contract not found" }, 404)
      if (result.status === "not_signable") {
        return c.json({ error: "Contract is not in a signable state" }, 409)
      }
      return c.json({ data: { signature: result.signature } })
    })
}

export const contractsPublicRoutes = createContractsPublicRoutes()

export type ContractsAdminRoutes = typeof contractsAdminRoutes
export type ContractsPublicRoutes = typeof contractsPublicRoutes
