import { sql } from "drizzle-orm"

export const ensurePgcryptoExtension = sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`
export const ensureIamSchema = sql`CREATE SCHEMA IF NOT EXISTS "iam";`
export const ensureInfraSchema = sql`CREATE SCHEMA IF NOT EXISTS "infra";`
