---
"@voyantjs/legal": minor
---

Add per-segment cancellation policy fan-out for multi-segment bookings (e.g. mid-stay room change with one flexible rate plan + one non-refundable rate plan).

Ships:

- `evaluateSegmentedCancellation(input)` — pure function, no I/O.
- `policiesService.evaluateMultiPolicyCancellation(db, segments, input)` — DB variant that resolves each segment's rules from a `policyId` (deduplicated; one query per unique policy).
- Types: `CancellationSegment`, `SegmentedCancellationInput`, `SegmentedCancellationResult` — aggregate totals + per-segment breakdown + `refundType` of `"mixed"` when segments resolve to different refund types (e.g. one full + one none).

Single-policy `evaluateCancellationPolicy` couldn't represent the "partial refund per segment" case; this resolves it without touching the existing API.
