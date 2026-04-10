import { policiesCoreService } from "./service-core.js"
import {
  _unused,
  type CancellationResult,
  type CancellationRule,
  evaluateCancellationPolicy,
} from "./service-shared.js"

export { _unused, type CancellationResult, type CancellationRule, evaluateCancellationPolicy }

export const policiesService = {
  ...policiesCoreService,
}
