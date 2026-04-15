DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'payment_session_target_type'
  ) THEN
    CREATE TYPE "public"."payment_session_target_type" AS ENUM(
      'booking',
      'order',
      'invoice',
      'booking_payment_schedule',
      'booking_guarantee',
      'other'
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'payment_session_status'
  ) THEN
    CREATE TYPE "public"."payment_session_status" AS ENUM(
      'pending',
      'requires_redirect',
      'processing',
      'authorized',
      'paid',
      'failed',
      'cancelled',
      'expired'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "payment_sessions" (
  "id" text PRIMARY KEY NOT NULL,
  "target_type" "payment_session_target_type" DEFAULT 'other' NOT NULL,
  "target_id" text,
  "booking_id" text,
  "order_id" text,
  "invoice_id" text,
  "booking_payment_schedule_id" text,
  "booking_guarantee_id" text,
  "payment_instrument_id" text,
  "payment_authorization_id" text,
  "payment_capture_id" text,
  "payment_id" text,
  "status" "payment_session_status" DEFAULT 'pending' NOT NULL,
  "provider" text,
  "provider_session_id" text,
  "provider_payment_id" text,
  "external_reference" text,
  "idempotency_key" text,
  "client_reference" text,
  "currency" text NOT NULL,
  "amount_cents" integer NOT NULL,
  "payment_method" "payment_method",
  "payer_person_id" text,
  "payer_organization_id" text,
  "payer_email" text,
  "payer_name" text,
  "redirect_url" text,
  "return_url" text,
  "cancel_url" text,
  "callback_url" text,
  "expires_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "failed_at" timestamp with time zone,
  "cancelled_at" timestamp with time zone,
  "expired_at" timestamp with time zone,
  "failure_code" text,
  "failure_message" text,
  "notes" text,
  "provider_payload" jsonb,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "payment_sessions_invoice_id_invoices_id_fk"
    FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action,
  CONSTRAINT "payment_sessions_booking_payment_schedule_id_booking_payment_schedules_id_fk"
    FOREIGN KEY ("booking_payment_schedule_id")
    REFERENCES "public"."booking_payment_schedules"("id")
    ON DELETE set null ON UPDATE no action,
  CONSTRAINT "payment_sessions_booking_guarantee_id_booking_guarantees_id_fk"
    FOREIGN KEY ("booking_guarantee_id")
    REFERENCES "public"."booking_guarantees"("id")
    ON DELETE set null ON UPDATE no action,
  CONSTRAINT "payment_sessions_payment_instrument_id_payment_instruments_id_fk"
    FOREIGN KEY ("payment_instrument_id")
    REFERENCES "public"."payment_instruments"("id")
    ON DELETE set null ON UPDATE no action,
  CONSTRAINT "payment_sessions_payment_authorization_id_payment_authorizations_id_fk"
    FOREIGN KEY ("payment_authorization_id")
    REFERENCES "public"."payment_authorizations"("id")
    ON DELETE set null ON UPDATE no action,
  CONSTRAINT "payment_sessions_payment_capture_id_payment_captures_id_fk"
    FOREIGN KEY ("payment_capture_id")
    REFERENCES "public"."payment_captures"("id")
    ON DELETE set null ON UPDATE no action,
  CONSTRAINT "payment_sessions_payment_id_payments_id_fk"
    FOREIGN KEY ("payment_id")
    REFERENCES "public"."payments"("id")
    ON DELETE set null ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS "idx_payment_sessions_target"
  ON "payment_sessions" USING btree ("target_type", "target_id");
CREATE INDEX IF NOT EXISTS "idx_payment_sessions_booking"
  ON "payment_sessions" USING btree ("booking_id");
CREATE INDEX IF NOT EXISTS "idx_payment_sessions_order"
  ON "payment_sessions" USING btree ("order_id");
CREATE INDEX IF NOT EXISTS "idx_payment_sessions_invoice"
  ON "payment_sessions" USING btree ("invoice_id");
CREATE INDEX IF NOT EXISTS "idx_payment_sessions_schedule"
  ON "payment_sessions" USING btree ("booking_payment_schedule_id");
CREATE INDEX IF NOT EXISTS "idx_payment_sessions_guarantee"
  ON "payment_sessions" USING btree ("booking_guarantee_id");
CREATE INDEX IF NOT EXISTS "idx_payment_sessions_status"
  ON "payment_sessions" USING btree ("status");
CREATE INDEX IF NOT EXISTS "idx_payment_sessions_provider"
  ON "payment_sessions" USING btree ("provider");
CREATE INDEX IF NOT EXISTS "idx_payment_sessions_provider_session"
  ON "payment_sessions" USING btree ("provider_session_id");
CREATE INDEX IF NOT EXISTS "idx_payment_sessions_expires_at"
  ON "payment_sessions" USING btree ("expires_at");
CREATE UNIQUE INDEX IF NOT EXISTS "uidx_payment_sessions_idempotency"
  ON "payment_sessions" USING btree ("idempotency_key");
CREATE UNIQUE INDEX IF NOT EXISTS "uidx_payment_sessions_provider_session"
  ON "payment_sessions" USING btree ("provider", "provider_session_id");
