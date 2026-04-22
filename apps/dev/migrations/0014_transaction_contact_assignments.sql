DO $$
BEGIN
  CREATE TYPE "public"."transaction_contact_assignment_role" AS ENUM ('primary_contact', 'other');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "offer_contact_assignments" (
  "id" text PRIMARY KEY NOT NULL,
  "offer_id" text NOT NULL,
  "offer_item_id" text,
  "person_id" text,
  "role" "public"."transaction_contact_assignment_role" DEFAULT 'primary_contact' NOT NULL,
  "first_name" text NOT NULL,
  "last_name" text NOT NULL,
  "email" text,
  "phone" text,
  "preferred_language" text,
  "is_primary" boolean DEFAULT false NOT NULL,
  "notes" text,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "offer_contact_assignments_offer_id_offers_id_fk"
    FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "offer_contact_assignments_offer_item_id_offer_items_id_fk"
    FOREIGN KEY ("offer_item_id") REFERENCES "public"."offer_items"("id") ON DELETE set null ON UPDATE no action
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "order_contact_assignments" (
  "id" text PRIMARY KEY NOT NULL,
  "order_id" text NOT NULL,
  "order_item_id" text,
  "person_id" text,
  "role" "public"."transaction_contact_assignment_role" DEFAULT 'primary_contact' NOT NULL,
  "first_name" text NOT NULL,
  "last_name" text NOT NULL,
  "email" text,
  "phone" text,
  "preferred_language" text,
  "is_primary" boolean DEFAULT false NOT NULL,
  "notes" text,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "order_contact_assignments_order_id_orders_id_fk"
    FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "order_contact_assignments_order_item_id_order_items_id_fk"
    FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE set null ON UPDATE no action
);--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_offer_contact_assignments_offer_created"
  ON "offer_contact_assignments" USING btree ("offer_id", "created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_offer_contact_assignments_item_created"
  ON "offer_contact_assignments" USING btree ("offer_item_id", "created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_offer_contact_assignments_role_created"
  ON "offer_contact_assignments" USING btree ("offer_id", "role", "created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_offer_contact_assignments_person_created"
  ON "offer_contact_assignments" USING btree ("person_id", "created_at");--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_order_contact_assignments_order_created"
  ON "order_contact_assignments" USING btree ("order_id", "created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_order_contact_assignments_item_created"
  ON "order_contact_assignments" USING btree ("order_item_id", "created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_order_contact_assignments_role_created"
  ON "order_contact_assignments" USING btree ("order_id", "role", "created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_order_contact_assignments_person_created"
  ON "order_contact_assignments" USING btree ("person_id", "created_at");--> statement-breakpoint

WITH linked_offer_contacts AS (
  SELECT
    op.id AS participant_id,
    op.offer_id,
    oip.offer_item_id,
    op.person_id,
    CASE WHEN oip.role = 'primary_contact' THEN 'primary_contact' ELSE 'other' END AS role,
    op.first_name,
    op.last_name,
    op.email,
    op.phone,
    op.preferred_language,
    (op.is_primary OR oip.is_primary) AS is_primary,
    op.notes,
    jsonb_build_object(
      'legacyParticipantId', op.id,
      'legacyParticipantType', op.participant_type,
      'legacyItemLinkId', oip.id,
      'legacyItemRole', oip.role
    ) AS metadata
  FROM "offer_participants" op
  INNER JOIN "offer_item_participants" oip ON oip.participant_id = op.id
  WHERE op.participant_type IN ('booker', 'contact')
),
unlinked_offer_contacts AS (
  SELECT
    op.id AS participant_id,
    op.offer_id,
    NULL::text AS offer_item_id,
    op.person_id,
    'primary_contact' AS role,
    op.first_name,
    op.last_name,
    op.email,
    op.phone,
    op.preferred_language,
    op.is_primary,
    op.notes,
    jsonb_build_object(
      'legacyParticipantId', op.id,
      'legacyParticipantType', op.participant_type
    ) AS metadata
  FROM "offer_participants" op
  WHERE op.participant_type IN ('booker', 'contact')
    AND NOT EXISTS (
      SELECT 1
      FROM "offer_item_participants" oip
      WHERE oip.participant_id = op.id
    )
),
all_offer_contacts AS (
  SELECT * FROM linked_offer_contacts
  UNION ALL
  SELECT * FROM unlinked_offer_contacts
)
INSERT INTO "offer_contact_assignments" (
  "id",
  "offer_id",
  "offer_item_id",
  "person_id",
  "role",
  "first_name",
  "last_name",
  "email",
  "phone",
  "preferred_language",
  "is_primary",
  "notes",
  "metadata"
)
SELECT
  'ofca_' || substr(md5(random()::text || clock_timestamp()::text || participant_id), 1, 24),
  offer_id,
  offer_item_id,
  person_id,
  role::"public"."transaction_contact_assignment_role",
  first_name,
  last_name,
  email,
  phone,
  preferred_language,
  is_primary,
  notes,
  metadata
FROM all_offer_contacts
WHERE NOT EXISTS (
  SELECT 1
  FROM "offer_contact_assignments" existing
  WHERE
    coalesce(existing.offer_item_id, '') = coalesce(all_offer_contacts.offer_item_id, '')
    AND (existing.metadata ->> 'legacyParticipantId') = all_offer_contacts.participant_id
);--> statement-breakpoint

WITH linked_order_contacts AS (
  SELECT
    op.id AS participant_id,
    op.order_id,
    oip.order_item_id,
    op.person_id,
    CASE WHEN oip.role = 'primary_contact' THEN 'primary_contact' ELSE 'other' END AS role,
    op.first_name,
    op.last_name,
    op.email,
    op.phone,
    op.preferred_language,
    (op.is_primary OR oip.is_primary) AS is_primary,
    op.notes,
    jsonb_build_object(
      'legacyParticipantId', op.id,
      'legacyParticipantType', op.participant_type,
      'legacyItemLinkId', oip.id,
      'legacyItemRole', oip.role
    ) AS metadata
  FROM "order_participants" op
  INNER JOIN "order_item_participants" oip ON oip.participant_id = op.id
  WHERE op.participant_type IN ('booker', 'contact')
),
unlinked_order_contacts AS (
  SELECT
    op.id AS participant_id,
    op.order_id,
    NULL::text AS order_item_id,
    op.person_id,
    'primary_contact' AS role,
    op.first_name,
    op.last_name,
    op.email,
    op.phone,
    op.preferred_language,
    op.is_primary,
    op.notes,
    jsonb_build_object(
      'legacyParticipantId', op.id,
      'legacyParticipantType', op.participant_type
    ) AS metadata
  FROM "order_participants" op
  WHERE op.participant_type IN ('booker', 'contact')
    AND NOT EXISTS (
      SELECT 1
      FROM "order_item_participants" oip
      WHERE oip.participant_id = op.id
    )
),
all_order_contacts AS (
  SELECT * FROM linked_order_contacts
  UNION ALL
  SELECT * FROM unlinked_order_contacts
)
INSERT INTO "order_contact_assignments" (
  "id",
  "order_id",
  "order_item_id",
  "person_id",
  "role",
  "first_name",
  "last_name",
  "email",
  "phone",
  "preferred_language",
  "is_primary",
  "notes",
  "metadata"
)
SELECT
  'orca_' || substr(md5(random()::text || clock_timestamp()::text || participant_id), 1, 24),
  order_id,
  order_item_id,
  person_id,
  role::"public"."transaction_contact_assignment_role",
  first_name,
  last_name,
  email,
  phone,
  preferred_language,
  is_primary,
  notes,
  metadata
FROM all_order_contacts
WHERE NOT EXISTS (
  SELECT 1
  FROM "order_contact_assignments" existing
  WHERE
    coalesce(existing.order_item_id, '') = coalesce(all_order_contacts.order_item_id, '')
    AND (existing.metadata ->> 'legacyParticipantId') = all_order_contacts.participant_id
);--> statement-breakpoint

DELETE FROM "offer_item_participants"
WHERE "participant_id" IN (
  SELECT "id"
  FROM "offer_participants"
  WHERE "participant_type" IN ('booker', 'contact')
);--> statement-breakpoint

DELETE FROM "order_item_participants"
WHERE "participant_id" IN (
  SELECT "id"
  FROM "order_participants"
  WHERE "participant_type" IN ('booker', 'contact')
);--> statement-breakpoint

DELETE FROM "offer_participants"
WHERE "participant_type" IN ('booker', 'contact');--> statement-breakpoint

DELETE FROM "order_participants"
WHERE "participant_type" IN ('booker', 'contact');--> statement-breakpoint
