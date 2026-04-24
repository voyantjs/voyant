---
"@voyantjs/utils": minor
"@voyantjs/legal": minor
"@voyantjs/legal-react": minor
---

End-to-end contract generation workflow for the operator template. Four-PR batch riding together on the fixed train:

**Template renderer filters (#270)** — Three new Liquid filters registered on `@voyantjs/utils`' shared template engine: `currency`, `cents` (integer cents → currency string), `format_date` with short/medium/long/iso presets. Picked up automatically by `renderStructuredTemplate` consumers (`@voyantjs/legal`, `@voyantjs/notifications`).

**Auto-generate on booking.confirmed (#271)** — `createLegalHonoModule` now accepts `autoGenerateContractOnConfirmed`: an opt-in subscriber that, on every `booking.confirmed` event, creates a contract against the configured template slug, renders its Liquid body with booking + traveler variables, and delegates to the configured PDF generator. Discriminated outcome (`template_not_found` / `template_version_missing` / `booking_not_found` / `contract_create_failed` / `document_failed` / `ok`) surfaces misconfigs at bootstrap. New `findTemplateBySlug` + `findSeriesByName` helpers on the template/series services. `@voyantjs/legal` now depends on `@voyantjs/bookings` (no cycle).

**Booking contract card hook plumbing (#272)** — `@voyantjs/legal-react` gains `generateDocument` + `regenerateDocument` mutations on `useLegalContractMutation`, `LegalContractsListFilters` now carries `bookingId` / `personId` / `organizationId` (already server-side-supported), new `legalContractGenerateDocumentResponse` schema. Paired registry component `voyant-legal-booking-contract-card` lists contracts for a booking with download + regenerate actions.

**Operator wiring (#273)** — Operator template now resolves a PDF document generator from the `DOCUMENTS_BUCKET` R2 binding, enables `autoGenerateContractOnConfirmed` against slug `customer-sales-agreement`, and its seed script now writes a proper Liquid-templated contract body + a `contract_template_versions` row so the auto-generate flow resolves end-to-end from first confirm.
