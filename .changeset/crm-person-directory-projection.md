---
"@voyantjs/crm": patch
---

Add a CRM-owned person directory projection so person list, detail, and export
reads no longer hydrate email, phone, website, and primary address fields
directly from identity tables on every read. Also align CRM child-list indexes
with the actual parent-and-sort query shapes used for notes, communications,
pipelines, stages, activity links/participants, opportunity participants and
products, and quote lines.
