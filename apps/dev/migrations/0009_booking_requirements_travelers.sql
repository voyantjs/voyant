ALTER TYPE "public"."contact_requirement_scope" RENAME VALUE 'participant' TO 'traveler';--> statement-breakpoint
ALTER TYPE "public"."booking_question_target" RENAME VALUE 'participant' TO 'traveler';--> statement-breakpoint
ALTER TYPE "public"."booking_answer_target" RENAME VALUE 'participant' TO 'traveler';--> statement-breakpoint

ALTER TABLE "product_contact_requirements"
  ALTER COLUMN "scope" SET DEFAULT 'traveler';--> statement-breakpoint

ALTER TABLE "product_contact_requirements"
  RENAME COLUMN "per_participant" TO "per_traveler";
