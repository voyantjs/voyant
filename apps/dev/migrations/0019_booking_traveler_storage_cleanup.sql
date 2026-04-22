DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'booking_participants'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'booking_travelers'
  ) THEN
    ALTER TABLE "booking_participants" RENAME TO "booking_travelers";
  END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'booking_item_participants'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'booking_item_travelers'
  ) THEN
    ALTER TABLE "booking_item_participants" RENAME TO "booking_item_travelers";
  END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'booking_participant_travel_details'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'booking_traveler_travel_details'
  ) THEN
    ALTER TABLE "booking_participant_travel_details" RENAME TO "booking_traveler_travel_details";
  END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'booking_pii_access_log' AND column_name = 'participant_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'booking_pii_access_log' AND column_name = 'traveler_id'
  ) THEN
    ALTER TABLE "booking_pii_access_log" RENAME COLUMN "participant_id" TO "traveler_id";
  END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'booking_documents' AND column_name = 'participant_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'booking_documents' AND column_name = 'traveler_id'
  ) THEN
    ALTER TABLE "booking_documents" RENAME COLUMN "participant_id" TO "traveler_id";
  END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'booking_fulfillments' AND column_name = 'participant_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'booking_fulfillments' AND column_name = 'traveler_id'
  ) THEN
    ALTER TABLE "booking_fulfillments" RENAME COLUMN "participant_id" TO "traveler_id";
  END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'booking_redemption_events' AND column_name = 'participant_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'booking_redemption_events' AND column_name = 'traveler_id'
  ) THEN
    ALTER TABLE "booking_redemption_events" RENAME COLUMN "participant_id" TO "traveler_id";
  END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'booking_item_travelers' AND column_name = 'participant_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'booking_item_travelers' AND column_name = 'traveler_id'
  ) THEN
    ALTER TABLE "booking_item_travelers" RENAME COLUMN "participant_id" TO "traveler_id";
  END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'booking_traveler_travel_details' AND column_name = 'participant_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'booking_traveler_travel_details' AND column_name = 'traveler_id'
  ) THEN
    ALTER TABLE "booking_traveler_travel_details" RENAME COLUMN "participant_id" TO "traveler_id";
  END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'booking_answers' AND column_name = 'booking_participant_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'booking_answers' AND column_name = 'booking_traveler_id'
  ) THEN
    ALTER TABLE "booking_answers" RENAME COLUMN "booking_participant_id" TO "booking_traveler_id";
  END IF;
END $$;
