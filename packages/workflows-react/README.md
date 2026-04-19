# @voyantjs/workflows-react

React hooks for triggering Voyant Workflows and subscribing to runs in
real time.

```tsx
import { useTriggerWorkflow, useRealtimeRun } from "@voyantjs/workflows-react";

export function GenerateContractButton() {
  const { trigger, run } = useTriggerWorkflow("generate-contract", {
    accessTokenEndpoint: "/api/voyant/token",
  });
  const live = useRealtimeRun(run?.id, { accessToken: run?.accessToken });

  return <button onClick={() => trigger({ customerId })}>Generate</button>;
}
```

See [`docs/sdk-surface.md`](../../docs/sdk-surface.md) §8.
