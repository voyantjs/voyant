---
"@voyantjs/plugin-netopia": patch
"@voyantjs/plugin-payload-cms": patch
"@voyantjs/plugin-sanity-cms": patch
"@voyantjs/plugin-smartbill": patch
---

Fix the published package layout so plugin build output lands at `dist/*` without leaking `dist/src/*` or compiled tests into npm tarballs.
