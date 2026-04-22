UPDATE "contract_number_series"
SET "prefix" = "code"
WHERE COALESCE("prefix", '') = '' AND COALESCE("code", '') <> '';--> statement-breakpoint
ALTER TABLE "contract_number_series" DROP CONSTRAINT IF EXISTS "contract_number_series_code_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "uq_contract_number_series_code";--> statement-breakpoint
ALTER TABLE "contract_number_series" DROP COLUMN IF EXISTS "code";
