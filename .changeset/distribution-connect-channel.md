---
"@voyantjs/distribution": minor
"@voyantjs/distribution-react": minor
---

Add `connect` value to `channelKindEnum` for partners running Voyant Connect (the inbound API integration surface where operators publish into a third-party network using Voyant infrastructure). Distinguishes from `api_partner`, which remains a generic third-party API integration.

Synchronised across pgEnum, Zod validation, React schemas / constants / hooks, registry dialogs, en/ro i18n labels, and template copies in `templates/dmc`, `templates/operator`, and `apps/dev`.
