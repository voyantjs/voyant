DROP INDEX "idx_products_person";--> statement-breakpoint
DROP INDEX "idx_products_organization";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "person_id";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "organization_id";