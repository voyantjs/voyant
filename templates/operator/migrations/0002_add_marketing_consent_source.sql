ALTER TABLE "user_profiles"
ADD COLUMN IF NOT EXISTS "marketing_consent_source" text;
