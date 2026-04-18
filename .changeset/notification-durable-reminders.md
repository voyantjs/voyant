---
"@voyantjs/notifications": patch
---

Make worker-driven due reminder processing durable by queueing reminder runs before provider delivery and delivering each run in its own retryable background task.
