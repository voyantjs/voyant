---
"@voyantjs/utils": patch
"@voyantjs/legal": patch
"@voyantjs/finance": patch
---

Upgrade legal and finance template rendering to support Liquid-style control
flow.

- add a shared structured template renderer in `@voyantjs/utils`
- keep simple `{{path}}` interpolation compatibility for existing templates
- support Liquid loops, conditionals, and filters in legal and finance
  html/markdown templates
- support Liquid rendering inside lexical text nodes for legal and finance
  template bodies
