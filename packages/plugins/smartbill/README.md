# @voyantjs/plugin-smartbill

SmartBill e-invoicing plugin for Voyant. Subscribes to invoice events and creates/cancels/syncs invoices via the SmartBill REST API for Romanian tax compliance.

## Install

```bash
pnpm add @voyantjs/plugin-smartbill
```

## Usage

```typescript
import { smartbillPlugin } from "@voyantjs/plugin-smartbill"
import { createApp } from "@voyantjs/hono"

const app = createApp({
  plugins: [
    smartbillPlugin({
      username: env.SMARTBILL_USERNAME,
      apiToken: env.SMARTBILL_API_TOKEN,
      companyVatCode: "RO12345678",
      seriesName: "A",
      // optional: language, art311SpecialRegime, events, mapEvent, logger
    }),
  ],
})
```

By default the plugin wires up 3 subscribers (`invoice.issued`, `invoice.voided`, `invoice.external.sync.requested`) that create, cancel, and check payment status on SmartBill. All error handling is fire-and-forget per the EventBus contract.

## Exports

| Entry | Description |
| --- | --- |
| `.` | Barrel re-exports |
| `./plugin` | `smartbillPlugin(options)` |
| `./client` | `createSmartbillClient` — `createInvoice`, `cancelInvoice`, `viewPdf`, `getPaymentStatus`, etc. |
| `./types` | SmartBill invoice types |

## License

FSL-1.1-Apache-2.0
